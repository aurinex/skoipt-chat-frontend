import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import type { Message } from "../types";

const getOldestMessageId = (messages: Message[]) => messages[0]?.id;

export const useChatMessagesQuery = (chatId: string | undefined) =>
  useInfiniteQuery({
    queryKey: queryKeys.messages.list(chatId ?? ""),
    queryFn: async ({ pageParam }) => {
      if (!chatId) return [];
      return pageParam
        ? api.messages.loadMore(chatId, pageParam)
        : api.messages.list(chatId);
    },
    initialPageParam: undefined as string | undefined,
    enabled: Boolean(chatId),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return getOldestMessageId(lastPage);
    },
  });
