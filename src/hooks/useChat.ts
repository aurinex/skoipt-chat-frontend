import { useEffect, useState, useRef, useCallback } from "react";
import api, { socket } from "../services/api";
import { useMessagesCache } from "./useMessagesCache";
import type { Message, ChatData, TypingUser } from "../types";

export const useChat = (
  chatId: string | undefined | null,
  myId: string | null,
) => {
  const cache = useMessagesCache();

  // Инициализируем из кеша сразу — без мерцания при возврате в чат
  const [messages, setMessages] = useState<Message[]>(
    chatId ? (cache.get(chatId) ?? []) : [],
  );
  const [isMsgsLoading, setIsMsgsLoading] = useState(
    chatId ? !cache.get(chatId) : false,
  );
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const typingTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const readTimerRef = useRef<NodeJS.Timeout | null>(null);

  const chatIdRef = useRef(chatId);
  const myIdRef = useRef(myId);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  const sendReadEvent = useCallback((messageId: string | number) => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      const currentChatId = chatIdRef.current;
      if (!currentChatId) return;
      socket.sendRead(currentChatId, messageId);
    }, 500);
  }, []);

  // Авто-прочтение при открытии или новых сообщениях
  useEffect(() => {
    if (messages.length === 0) return;
    const lastIncoming = [...messages]
      .reverse()
      .find(
        (m) => String(m.sender_id) !== String(myIdRef.current) && !m._pending,
      );
    if (lastIncoming) sendReadEvent(lastIncoming.id);
  }, [messages.length, chatId, sendReadEvent]);

  // Загрузка — только если нет в кеше
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setChatData(null);
      setIsMsgsLoading(false);
      return;
    }

    const cached = cache.get(chatId);
    if (cached) {
      // Есть кеш — показываем сразу, грузим chatData
      setMessages(cached);
      setIsMsgsLoading(false);
    } else {
      // Нет кеша — загружаем
      setIsMsgsLoading(true);
      setMessages([]);
      api.messages
        .list(chatId)
        .then((msgs: Message[]) => {
          cache.set(chatId, msgs);
          setMessages(msgs);
          setIsMsgsLoading(false);
        })
        .catch(() => setIsMsgsLoading(false));
    }

    setChatData(null);
    api.chats
      .get(chatId)
      .then(setChatData)
      .catch((err: Error) => console.error("Ошибка загрузки чата", err));
  }, [chatId]);

  // Обёртка setMessages которая синхронно обновляет кеш
  const setMessagesWithCache = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (chatIdRef.current) cache.set(chatIdRef.current, next);
        return next;
      });
    },
    [],
  );

  // WebSocket подписки
  useEffect(() => {
    if (!chatId) return;

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg: Message = data.message || data;
      if (String(msg.chat_id) !== String(chatIdRef.current)) return;
      setMessagesWithCache((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (String(msg.sender_id) !== myIdRef.current) sendReadEvent(msg.id);
    });

    const unsubRead = socket.on("read", (data: any) => {
      if (String(data.chat_id) !== String(chatIdRef.current)) return;
      setMessagesWithCache((prev) =>
        prev.map((msg) => {
          if (!data.message_ids.includes(msg.id)) return msg;
          const alreadyRead = msg.read_by?.some(
            (r) => r.user_id === data.user_id,
          );
          if (alreadyRead) return msg;
          return {
            ...msg,
            read_by: [
              ...(msg.read_by ?? []),
              { user_id: data.user_id, read_at: data.read_at },
            ],
          };
        }),
      );
    });

    const unsubTyping = socket.on("typing", (data: any) => {
      if (String(data.chat_id) !== String(chatIdRef.current)) return;
      const userId: string = data.user_id;
      if (data.is_typing) {
        setTypingUsers((prev) =>
          prev.some((u) => u.user_id === userId) ? prev : [...prev, data],
        );
        if (typingTimersRef.current[userId])
          clearTimeout(typingTimersRef.current[userId]);
        typingTimersRef.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== userId));
          delete typingTimersRef.current[userId];
        }, 5000);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.user_id !== userId));
        if (typingTimersRef.current[userId]) {
          clearTimeout(typingTimersRef.current[userId]);
          delete typingTimersRef.current[userId];
        }
      }
    });

    const unsubEdited = socket.on("message_edited", (data: any) => {
      if (String(data.chat_id) !== String(chatIdRef.current)) return;
      setMessagesWithCache((prev) =>
        prev.map((m) =>
          m.id === data.message_id
            ? {
                ...m,
                text: data.text,
                is_edited: true,
                edited_at: data.edited_at,
              }
            : m,
        ),
      );
    });

    const unsubDeleted = socket.on("message_deleted", (data: any) => {
      if (String(data.chat_id) !== String(chatIdRef.current)) return;
      setMessagesWithCache((prev) =>
        prev.filter((m) => m.id !== data.message_id),
      );
    });

    const unsubChatUpdated = socket.on("chat_updated", (data: any) => {
      if (String(data.chat_id) !== String(chatIdRef.current)) return;
      setChatData((prev) =>
        prev
          ? {
              ...prev,
              member_count: data.member_count,
              members: data.members,
              admins: data.admins,
            }
          : prev,
      );
    });

    return () => {
      unsubMsg();
      unsubRead();
      unsubTyping();
      unsubEdited();
      unsubDeleted();
      unsubChatUpdated();
      Object.values(typingTimersRef.current).forEach(clearTimeout);
    };
  }, [chatId, sendReadEvent, setMessagesWithCache]);

  return {
    messages,
    setMessages: setMessagesWithCache,
    isMsgsLoading,
    chatData,
    setChatData,
    typingUsers,
  };
};
