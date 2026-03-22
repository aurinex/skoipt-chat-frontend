import { create } from "zustand";
import { queryClient } from "../lib/queryClient";
import { queryKeys } from "../lib/queryKeys";
import { socket } from "../services/api";
import type { Message, TypingUser } from "../types";
import { getMessagesFromPages } from "../queries/messageCache";

const EMPTY_TYPING_USERS: TypingUser[] = [];

export interface ActiveChatState {
  currentChatId: string | null;
  currentUserId: string | null;
  typingUsersByChatId: Record<string, TypingUser[]>;
  setCurrentChat: (chatId: string | null, userId: string | null) => void;
  initializeRealtime: () => void;
}

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
let readTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeInitialized = false;

const getTypingTimerKey = (chatId: string, userId: string) => `${chatId}:${userId}`;

const getTypingUsersForChat = (state: ActiveChatState, chatId: string) =>
  state.typingUsersByChatId[chatId] ?? EMPTY_TYPING_USERS;

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
  typingUsers: (chatId: string | undefined) => (state: ActiveChatState) =>
    chatId ? getTypingUsersForChat(state, chatId) : EMPTY_TYPING_USERS,
};

export const useActiveChatStore = create<ActiveChatState>((set, get) => ({
  currentChatId: null,
  currentUserId: null,
  typingUsersByChatId: {},

  setCurrentChat: (chatId, userId) => {
    const state = get();
    if (state.currentChatId === chatId && state.currentUserId === userId) return;
    set({ currentChatId: chatId, currentUserId: userId });
  },

  initializeRealtime: () => {
    if (realtimeInitialized) return;
    realtimeInitialized = true;

    socket.on("new_message", (data) => {
      const message = data.message || data;
      const chatId = String(message.chat_id);

      queryClient.setQueryData(
        queryKeys.messages.list(chatId),
        (
          current:
            | { pages: Message[][]; pageParams: Array<string | undefined> }
            | undefined,
        ) => {
          const currentMessages = getMessagesFromPages(current?.pages);
          if (currentMessages.some((item) => item.id === message.id)) {
            return current ?? { pages: [currentMessages], pageParams: [undefined] };
          }

          const nextMessages = [...currentMessages, message];
          syncReadStateIfNeeded(chatId, nextMessages, get().currentUserId);

          return { pages: [nextMessages], pageParams: [undefined] };
        },
      );
    });

    socket.on("read", (data) => {
      const chatId = String(data.chat_id);

      queryClient.setQueryData(
        queryKeys.messages.list(chatId),
        (
          current:
            | { pages: Message[][]; pageParams: Array<string | undefined> }
            | undefined,
        ) => {
          const currentMessages = getMessagesFromPages(current?.pages);
          const nextMessages = currentMessages.map((message) => {
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
          });

          return { pages: [nextMessages], pageParams: [undefined] };
        },
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

      queryClient.setQueryData(
        queryKeys.messages.list(chatId),
        (
          current:
            | { pages: Message[][]; pageParams: Array<string | undefined> }
            | undefined,
        ) => {
          const currentMessages = getMessagesFromPages(current?.pages);
          const nextMessages = currentMessages.map((message) =>
          message.id === data.message_id
            ? {
                ...message,
                text: data.text,
                is_edited: true,
                edited_at: data.edited_at,
              }
            : message,
          );

          return { pages: [nextMessages], pageParams: [undefined] };
        },
      );
    });

    socket.on("message_deleted", (data) => {
      const chatId = String(data.chat_id);

      queryClient.setQueryData(
        queryKeys.messages.list(chatId),
        (
          current:
            | { pages: Message[][]; pageParams: Array<string | undefined> }
            | undefined,
        ) => {
          const currentMessages = getMessagesFromPages(current?.pages);
          const nextMessages = currentMessages.filter(
            (message) => message.id !== data.message_id,
          );

          return { pages: [nextMessages], pageParams: [undefined] };
        },
      );
    });

    socket.on("chat_updated", (data) => {
      const chatId = String(data.chat_id);

      queryClient.setQueryData(
        queryKeys.chats.detail(chatId),
        (prev: { member_count?: number; members?: string[]; admins?: string[] } | null | undefined) =>
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
