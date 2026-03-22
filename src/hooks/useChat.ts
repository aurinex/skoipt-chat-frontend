import { useEffect, useMemo } from "react";
import type { Message, ChatData } from "../types";
import { useActiveChatStore } from "../stores/useActiveChatStore";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING_USERS: Array<{ user_id: string; first_name?: string; last_name?: string }> = [];

export const useChat = (
  chatId: string | undefined | null,
  myId: string | null,
) => {
  const initializeRealtime = useActiveChatStore(
    (state) => state.initializeRealtime,
  );
  const setCurrentChat = useActiveChatStore((state) => state.setCurrentChat);
  const loadChat = useActiveChatStore((state) => state.loadChat);
  const setMessagesForChat = useActiveChatStore(
    (state) => state.setMessagesForChat,
  );
  const setChatDataForChat = useActiveChatStore(
    (state) => state.setChatDataForChat,
  );

  const messages = useActiveChatStore((state) =>
    chatId ? (state.messagesByChatId[chatId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const isMsgsLoading = useActiveChatStore((state) =>
    chatId ? (state.loadingByChatId[chatId] ?? false) : false,
  );
  const chatData = useActiveChatStore((state) =>
    chatId ? (state.chatDataByChatId[chatId] ?? null) : null,
  );
  const typingUsers = useActiveChatStore((state) =>
    chatId
      ? (state.typingUsersByChatId[chatId] ?? EMPTY_TYPING_USERS)
      : EMPTY_TYPING_USERS,
  );

  useEffect(() => {
    initializeRealtime();
  }, [initializeRealtime]);

  useEffect(() => {
    setCurrentChat(chatId ?? null, myId);

    if (chatId) {
      void loadChat(chatId);
    }
  }, [chatId, loadChat, myId, setCurrentChat]);

  const setMessages = useMemo(
    () => (updater: Message[] | ((prev: Message[]) => Message[])) => {
      if (!chatId) return;
      setMessagesForChat(chatId, updater);
    },
    [chatId, setMessagesForChat],
  );

  const setChatData = useMemo(
    () =>
      (
        updater:
          | ChatData
          | null
          | ((prev: ChatData | null) => ChatData | null),
      ) => {
        if (!chatId) return;
        setChatDataForChat(chatId, updater);
      },
    [chatId, setChatDataForChat],
  );

  return {
    messages,
    setMessages,
    isMsgsLoading,
    chatData,
    setChatData,
    typingUsers,
  };
};
