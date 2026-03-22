import { create } from "zustand";
import api, { socket } from "../services/api";
import type { ChatData, Message, TypingUser } from "../types";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING_USERS: TypingUser[] = [];

export interface ActiveChatState {
  currentChatId: string | null;
  currentUserId: string | null;
  messagesByChatId: Record<string, Message[]>;
  loadingByChatId: Record<string, boolean>;
  chatDataByChatId: Record<string, ChatData | null>;
  typingUsersByChatId: Record<string, TypingUser[]>;
  setCurrentChat: (chatId: string | null, userId: string | null) => void;
  loadChat: (chatId: string) => Promise<void>;
  setMessagesForChat: (
    chatId: string,
    updater: Message[] | ((prev: Message[]) => Message[]),
  ) => void;
  setChatDataForChat: (
    chatId: string,
    updater: ChatData | null | ((prev: ChatData | null) => ChatData | null),
  ) => void;
  initializeRealtime: () => void;
}

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
let readTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeInitialized = false;

const getTypingTimerKey = (chatId: string, userId: string) => `${chatId}:${userId}`;

const getMessagesForChat = (state: ActiveChatState, chatId: string) =>
  state.messagesByChatId[chatId] ?? EMPTY_MESSAGES;

const getTypingUsersForChat = (state: ActiveChatState, chatId: string) =>
  state.typingUsersByChatId[chatId] ?? EMPTY_TYPING_USERS;

const updateMessagesForChatState = (
  state: ActiveChatState,
  chatId: string,
  updater: Message[] | ((prev: Message[]) => Message[]),
) => {
  const currentMessages = getMessagesForChat(state, chatId);
  const nextMessages =
    typeof updater === "function" ? updater(currentMessages) : updater;

  return {
    messagesByChatId: { ...state.messagesByChatId, [chatId]: nextMessages },
  };
};

const updateChatDataForChatState = (
  state: ActiveChatState,
  chatId: string,
  updater: ChatData | null | ((prev: ChatData | null) => ChatData | null),
) => {
  const currentChatData = state.chatDataByChatId[chatId] ?? null;
  const nextChatData =
    typeof updater === "function" ? updater(currentChatData) : updater;

  return {
    chatDataByChatId: { ...state.chatDataByChatId, [chatId]: nextChatData },
  };
};

const addTypingUserToState = (
  state: ActiveChatState,
  chatId: string,
  userId: string,
  user: TypingUser,
) => {
  const currentUsers = getTypingUsersForChat(state, chatId);
  const nextUsers = currentUsers.some((item) => item.user_id === userId)
    ? currentUsers
    : [...currentUsers, user];

  return {
    typingUsersByChatId: {
      ...state.typingUsersByChatId,
      [chatId]: nextUsers,
    },
  };
};

const removeTypingUserFromState = (
  state: ActiveChatState,
  chatId: string,
  userId: string,
) => ({
  typingUsersByChatId: {
    ...state.typingUsersByChatId,
    [chatId]: getTypingUsersForChat(state, chatId).filter(
      (user) => user.user_id !== userId,
    ),
  },
});

const scheduleReadEvent = (chatId: string, messageId: string | number) => {
  if (readTimer) clearTimeout(readTimer);

  readTimer = setTimeout(() => {
    socket.sendRead(chatId, messageId);
  }, 500);
};

const syncReadStateIfNeeded = (
  chatId: string,
  messages: Message[],
  currentUserId: string | null,
) => {
  const lastIncoming = [...messages]
    .reverse()
    .find((message) => String(message.sender_id) !== String(currentUserId) && !message._pending);

  if (lastIncoming) {
    scheduleReadEvent(chatId, lastIncoming.id);
  }
};

export const activeChatSelectors = {
  currentChatId: (state: ActiveChatState) => state.currentChatId,
  initializeRealtime: (state: ActiveChatState) => state.initializeRealtime,
  setCurrentChat: (state: ActiveChatState) => state.setCurrentChat,
  loadChat: (state: ActiveChatState) => state.loadChat,
  setMessagesForChat: (state: ActiveChatState) => state.setMessagesForChat,
  messages: (chatId: string | undefined) => (state: ActiveChatState) =>
    chatId ? getMessagesForChat(state, chatId) : EMPTY_MESSAGES,
  isLoading: (chatId: string | undefined) => (state: ActiveChatState) =>
    chatId ? (state.loadingByChatId[chatId] ?? false) : false,
  chatData: (chatId: string | undefined) => (state: ActiveChatState) =>
    chatId ? (state.chatDataByChatId[chatId] ?? null) : null,
  typingUsers: (chatId: string | undefined) => (state: ActiveChatState) =>
    chatId ? getTypingUsersForChat(state, chatId) : EMPTY_TYPING_USERS,
};

export const useActiveChatStore = create<ActiveChatState>((set, get) => ({
  currentChatId: null,
  currentUserId: null,
  messagesByChatId: {},
  loadingByChatId: {},
  chatDataByChatId: {},
  typingUsersByChatId: {},

  setCurrentChat: (chatId, userId) => {
    const state = get();
    if (state.currentChatId === chatId && state.currentUserId === userId) return;
    set({ currentChatId: chatId, currentUserId: userId });
  },

  loadChat: async (chatId) => {
    const state = get();
    const cachedMessages = state.messagesByChatId[chatId];

    if (cachedMessages) {
      set((prev) => ({
        loadingByChatId: { ...prev.loadingByChatId, [chatId]: false },
      }));
      syncReadStateIfNeeded(chatId, cachedMessages, state.currentUserId);
    } else {
      set((prev) => ({
        loadingByChatId: { ...prev.loadingByChatId, [chatId]: true },
        messagesByChatId: { ...prev.messagesByChatId, [chatId]: EMPTY_MESSAGES },
      }));

      try {
        const messages = await api.messages.list(chatId);
        set((prev) => ({
          messagesByChatId: { ...prev.messagesByChatId, [chatId]: messages },
          loadingByChatId: { ...prev.loadingByChatId, [chatId]: false },
        }));
        syncReadStateIfNeeded(chatId, messages, get().currentUserId);
      } catch {
        set((prev) => ({
          loadingByChatId: { ...prev.loadingByChatId, [chatId]: false },
        }));
      }
    }

    set((prev) => ({
      chatDataByChatId: { ...prev.chatDataByChatId, [chatId]: prev.chatDataByChatId[chatId] ?? null },
    }));

    try {
      const chatData = await api.chats.get(chatId);
      set((prev) => ({
        chatDataByChatId: { ...prev.chatDataByChatId, [chatId]: chatData },
      }));
    } catch (error) {
      console.error("Ошибка загрузки чата", error);
    }
  },

  setMessagesForChat: (chatId, updater) => {
    set((prev) => updateMessagesForChatState(prev, chatId, updater));

    syncReadStateIfNeeded(
      chatId,
      getMessagesForChat(get(), chatId),
      get().currentUserId,
    );
  },

  setChatDataForChat: (chatId, updater) => {
    set((prev) => updateChatDataForChatState(prev, chatId, updater));
  },

  initializeRealtime: () => {
    if (realtimeInitialized) return;
    realtimeInitialized = true;

    socket.on("new_message", (data) => {
      const message = data.message || data;
      const chatId = String(message.chat_id);

      get().setMessagesForChat(chatId, (prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("read", (data) => {
      const chatId = String(data.chat_id);

      get().setMessagesForChat(chatId, (prev) =>
        prev.map((message) => {
          if (!data.message_ids.includes(message.id)) return message;

          const alreadyRead = message.read_by?.some(
            (reader) => reader.user_id === data.user_id,
          );
          if (alreadyRead) return message;

          return {
            ...message,
            read_by: [
              ...(message.read_by ?? []),
              { user_id: data.user_id, read_at: data.read_at },
            ],
          };
        }),
      );
    });

    socket.on("typing", (data) => {
      const chatId = String(data.chat_id);
      const userId = String(data.user_id);
      const timerKey = getTypingTimerKey(chatId, userId);

      if (data.is_typing) {
        set((prev) => addTypingUserToState(prev, chatId, userId, data));

        const currentTimer = typingTimers.get(timerKey);
        if (currentTimer) clearTimeout(currentTimer);

        typingTimers.set(
          timerKey,
          setTimeout(() => {
            set((prev) => removeTypingUserFromState(prev, chatId, userId));
            typingTimers.delete(timerKey);
          }, 5000),
        );
      } else {
        set((prev) => removeTypingUserFromState(prev, chatId, userId));

        const currentTimer = typingTimers.get(timerKey);
        if (currentTimer) {
          clearTimeout(currentTimer);
          typingTimers.delete(timerKey);
        }
      }
    });

    socket.on("message_edited", (data) => {
      const chatId = String(data.chat_id);

      get().setMessagesForChat(chatId, (prev) =>
        prev.map((message) =>
          message.id === data.message_id
            ? {
                ...message,
                text: data.text,
                is_edited: true,
                edited_at: data.edited_at,
              }
            : message,
        ),
      );
    });

    socket.on("message_deleted", (data) => {
      const chatId = String(data.chat_id);

      get().setMessagesForChat(chatId, (prev) =>
        prev.filter((message) => message.id !== data.message_id),
      );
    });

    socket.on("chat_updated", (data) => {
      const chatId = String(data.chat_id);

      get().setChatDataForChat(chatId, (prev) =>
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
  },
}));
