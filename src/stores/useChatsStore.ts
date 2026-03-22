import { create } from "zustand";
import api, { getMyId } from "../services/api";
import type { Chat, Message } from "../types";

interface ChatsState {
  chats: Chat[];
  isLoading: boolean;
  loadChats: () => Promise<void>;
  updateChatFromMessage: (message: Message) => void;
  setChatTyping: (chatId: string, isTyping: boolean) => void;
  markChatLastMessageRead: (chatId: string, messageIds: string[]) => void;
  syncUnreadCount: (chatId: string, unreadCount: number) => void;
  prependChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
}

const normalizeLastMessage = (message: Message): Message => {
  const myId = getMyId();

  return {
    ...message,
    is_mine: message.is_mine ?? String(message.sender_id) === String(myId),
  };
};

const normalizeChat = (chat: Chat): Chat => ({
  ...chat,
  last_message: chat.last_message
    ? normalizeLastMessage(chat.last_message)
    : chat.last_message,
});

export const useChatsStore = create<ChatsState>((set) => ({
  chats: [],
  isLoading: true,

  loadChats: async () => {
    set({ isLoading: true });

    try {
      const chats = await api.chats.list();
      set({
        chats: chats.map((chat: Chat) => normalizeChat(chat)),
        isLoading: false,
      });
    } catch (error) {
      console.error("Ошибка загрузки чатов:", error);
      set({ isLoading: false });
    }
  },

  updateChatFromMessage: (message) =>
    set((state) => {
      const chatIndex = state.chats.findIndex(
        (chat) => String(chat.id) === String(message.chat_id),
      );

      if (chatIndex === -1) return state;

      const updatedChats = [...state.chats];
      const targetChat = updatedChats[chatIndex];

      updatedChats.splice(chatIndex, 1);
      updatedChats.unshift({
        ...targetChat,
        last_message: normalizeLastMessage(message),
      });

      return { chats: updatedChats };
    }),

  setChatTyping: (chatId, isTyping) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        String(chat.id) === String(chatId) ? { ...chat, is_typing: isTyping } : chat,
      ),
    })),

  markChatLastMessageRead: (chatId, messageIds) =>
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (String(chat.id) !== String(chatId) || !chat.last_message) return chat;
        if (!messageIds.includes(chat.last_message.id)) return chat;

        return {
          ...chat,
          last_message: { ...chat.last_message, is_read: true },
        };
      }),
    })),

  syncUnreadCount: (chatId, unreadCount) =>
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (String(chat.id) !== String(chatId) || unreadCount !== 0) return chat;

        return {
          ...chat,
          last_message: chat.last_message
            ? { ...chat.last_message, is_read: true }
            : chat.last_message,
        };
      }),
    })),

  prependChat: (chat) =>
    set((state) => {
      if (state.chats.some((item) => String(item.id) === String(chat.id))) {
        return state;
      }

      return { chats: [normalizeChat(chat), ...state.chats] };
    }),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((chat) => String(chat.id) !== String(chatId)),
    })),
}));
