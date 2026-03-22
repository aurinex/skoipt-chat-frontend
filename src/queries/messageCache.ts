import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import type { ChatData, Message } from "../types";

const EMPTY_MESSAGES: Message[] = [];

export const flattenMessagePages = (pages: Message[][]): Message[] =>
  [...pages].reverse().flatMap((page) => page);

export const getMessagesFromPages = (pages?: Message[][]): Message[] =>
  pages ? flattenMessagePages(pages) : EMPTY_MESSAGES;

export const useMessageCacheActions = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  return {
    setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => {
      if (!chatId) return;

      queryClient.setQueryData(
        queryKeys.messages.list(chatId),
        (current: { pages: Message[][]; pageParams: Array<string | undefined> } | undefined) => {
          const currentPages = current?.pages ?? [];
          const currentMessages = getMessagesFromPages(currentPages);
          const nextMessages =
            typeof updater === "function" ? updater(currentMessages) : updater;

          return {
            pages: [nextMessages],
            pageParams: [undefined],
          };
        },
      );
    },
    updateChatData: (
      updater:
        | ChatData
        | null
        | ((prev: ChatData | null) => ChatData | null),
    ) => {
      if (!chatId) return;

      queryClient.setQueryData<ChatData | null>(
        queryKeys.chats.detail(chatId),
        (current) =>
          typeof updater === "function" ? updater(current ?? null) : updater,
      );
    },
    invalidateMessages: async () => {
      if (!chatId) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(chatId),
      });
    },
  };
};
