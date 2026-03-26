import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { loadCachedChatMessages, saveCachedChatMessages } from "../lib/chatIndexedCache";
import api from "../services/api";
import type { Message } from "../types";
import { collectUsersFromMessages, upsertUsers } from "../stores/useUserStore";
import { flattenMessagePages } from "./messageCache";

const getOldestMessageId = (messages: Message[]) => messages[0]?.id;

export const useChatMessagesQuery = (chatId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages.list(chatId ?? "");

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!chatId) return [];
      const messages = pageParam
        ? api.messages.loadMore(chatId, pageParam)
        : api.messages.list(chatId);
      const resolvedMessages = await messages;
      upsertUsers(collectUsersFromMessages(resolvedMessages));
      return resolvedMessages;
    },
    initialPageParam: undefined as string | undefined,
    enabled: Boolean(chatId),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return getOldestMessageId(lastPage);
    },
  });

  useEffect(() => {
    if (!chatId) return;

    let isActive = true;

    void loadCachedChatMessages(chatId).then((cached) => {
      if (!isActive || !cached) return;

      const existing = queryClient.getQueryData(queryKey);
      if (existing) return;

      upsertUsers(collectUsersFromMessages(cached.messages));
      queryClient.setQueryData(queryKey, {
        pages: [cached.messages],
        pageParams: [undefined],
      });

      if (Date.now() - cached.updatedAt > 30_000) {
        void queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => {
      isActive = false;
    };
  }, [chatId, queryClient, queryKey]);

  useEffect(() => {
    if (!chatId || !query.data?.pages?.length) return;

    const messages = flattenMessagePages(query.data.pages);
    void saveCachedChatMessages(chatId, messages);
  }, [chatId, query.data?.pages]);

  return query;
};
