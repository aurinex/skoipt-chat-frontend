import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getMyId } from "../services/api";
import type { Chat, Message } from "../types";

export const normalizeLastMessage = (message: Message): Message => {
  const myId = getMyId();

  return {
    ...message,
    is_mine: message.is_mine ?? String(message.sender_id) === String(myId),
  };
};

export const normalizeChat = (chat: Chat): Chat => ({
  ...chat,
  last_message: chat.last_message
    ? normalizeLastMessage(chat.last_message)
    : chat.last_message,
});

export const normalizeChats = (chats: Chat[]): Chat[] =>
  chats.map((chat) => normalizeChat(chat));

const moveChatToTop = (
  chats: Chat[],
  chatId: string,
  updater: (chat: Chat) => Chat,
) => {
  const chatIndex = chats.findIndex((chat) => String(chat.id) === String(chatId));
  if (chatIndex === -1) return chats;

  const updatedChats = [...chats];
  const targetChat = updatedChats[chatIndex];
  updatedChats.splice(chatIndex, 1);
  updatedChats.unshift(updater(targetChat));

  return updatedChats;
};

const updateChatById = (
  chats: Chat[],
  chatId: string,
  updater: (chat: Chat) => Chat,
) =>
  chats.map((chat) =>
    String(chat.id) === String(chatId) ? updater(chat) : chat,
  );

export const useChatListCacheActions = () => {
  const queryClient = useQueryClient();

  return {
    updateChatFromMessage: (message: Message) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) => {
        const nextChats = moveChatToTop(current, String(message.chat_id), (chat) => ({
          ...chat,
          last_message: normalizeLastMessage(message),
        }));

        return nextChats === current ? current : nextChats;
      });
    },
    setChatTyping: (chatId: string, isTyping: boolean) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) =>
        updateChatById(current, chatId, (chat) => ({
          ...chat,
          is_typing: isTyping,
        })),
      );
    },
    markChatLastMessageRead: (chatId: string, messageIds: string[]) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) =>
        updateChatById(current, chatId, (chat) => {
          if (!chat.last_message) return chat;
          if (!messageIds.includes(chat.last_message.id)) return chat;

          return {
            ...chat,
            last_message: { ...chat.last_message, is_read: true },
          };
        }),
      );
    },
    syncUnreadCount: (chatId: string, unreadCount: number) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) =>
        updateChatById(current, chatId, (chat) => ({
          ...chat,
          unread_count: unreadCount,
          last_message:
            unreadCount === 0 && chat.last_message
              ? { ...chat.last_message, is_read: true }
              : chat.last_message,
        })),
      );
    },
    prependChat: (chat: Chat) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) => {
        if (current.some((item) => String(item.id) === String(chat.id))) {
          return current;
        }

        return [normalizeChat(chat), ...current];
      });
    },
    removeChat: (chatId: string) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) =>
        current.filter((chat) => String(chat.id) !== String(chatId)),
      );
    },
    setChatLastMessage: (chatId: string, message: Message | null) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats.all, (current = []) =>
        updateChatById(current, chatId, (chat) => ({
          ...chat,
          last_message: message ? normalizeLastMessage(message) : null,
        })),
      );
    },
    invalidateChats: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  };
};
