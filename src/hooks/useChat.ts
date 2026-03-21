import { useEffect, useState, useRef, useCallback } from "react";
import api, { socket } from "../services/api";

export const useChat = (chatId: string | undefined, myId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isMsgsLoading, setIsMsgsLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  const typingTimersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const readTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Храним актуальные chatId и myId в ref — чтобы замыкания в колбэках
  // всегда читали свежее значение, а не то что было при создании эффекта
  const chatIdRef = useRef(chatId);
  const myIdRef = useRef(myId);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  const sendReadEvent = useCallback((messageId: number | string) => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      const currentChatId = chatIdRef.current;
      if (!currentChatId) return;
      console.log("[READ] Отправляю read:", currentChatId, messageId);
      socket.sendRead(currentChatId, messageId);
    }, 500);
  }, []); // нет зависимостей — функция стабильна, читает из ref

  // Авто-прочтение при открытии чата или новых сообщениях
  useEffect(() => {
    if (messages.length > 0) {
      const lastIncoming = [...messages]
        .reverse()
        .find((m) => String(m.sender_id) !== String(myIdRef.current));
      if (lastIncoming) {
        sendReadEvent(lastIncoming.id);
      }
    }
  }, [messages.length, chatId, sendReadEvent]);

  // Загрузка данных чата и сообщений
  useEffect(() => {
    if (!chatId) return;

    setIsMsgsLoading(true);
    setMessages([]);
    setChatData(null);

    api.messages
      .list(chatId)
      .then((msgs) => {
        setMessages(msgs);
        setIsMsgsLoading(false);
      })
      .catch(() => setIsMsgsLoading(false));

    api.chats
      .get(chatId)
      .then(setChatData)
      .catch((err) => console.error("Ошибка загрузки чата", err));
  }, [chatId]);

  // Слушаем сокеты
  useEffect(() => {
    if (!chatId) return;

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      if (String(msg.chat_id) === String(chatIdRef.current)) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (String(msg.sender_id) !== myIdRef.current) {
          sendReadEvent(msg.id);
        }
      }
    });

    const unsubRead = socket.on("read", (data: any) => {
      if (String(data.chat_id) === String(chatIdRef.current)) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (data.message_ids.includes(msg.id)) {
              const alreadyRead = msg.read_by?.some(
                (r: any) => r.user_id === data.user_id,
              );
              if (alreadyRead) return msg;
              return {
                ...msg,
                read_by: [
                  ...(msg.read_by || []),
                  { user_id: data.user_id, read_at: data.read_at },
                ],
              };
            }
            return msg;
          }),
        );
      }
    });

    const unsubTyping = socket.on("typing", (data: any) => {
      if (String(data.chat_id) === String(chatIdRef.current)) {
        const userId = data.user_id;

        if (data.is_typing) {
          setTypingUsers((prev) =>
            prev.some((u) => u.user_id === userId) ? prev : [...prev, data],
          );

          if (typingTimersRef.current[userId]) {
            clearTimeout(typingTimersRef.current[userId]);
          }

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
      }
    });

    const unsubEdited = socket.on("message_edited", (data: any) => {
      if (String(data.chat_id) === String(chatIdRef.current)) {
        setMessages((prev) =>
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
      }
    });

    const unsubDeleted = socket.on("message_deleted", (data: any) => {
      if (String(data.chat_id) === String(chatIdRef.current)) {
        setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
      }
    });

    const unsubChatUpdated = socket.on("chat_updated", (data: any) => {
      if (String(data.chat_id) === String(chatIdRef.current)) {
        setChatData((prev: any) => ({
          ...prev,
          member_count: data.member_count,
          members: data.members,
          admins: data.admins,
        }));
      }
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
  }, [chatId, sendReadEvent]);

  return {
    messages,
    setMessages,
    isMsgsLoading,
    chatData,
    setChatData,
    typingUsers,
  };
};
