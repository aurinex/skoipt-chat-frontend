import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { loadCachedChatMedia, saveCachedChatMedia } from "../lib/chatIndexedCache";
import api from "../services/api";

export const useChatMediaQuery = (
  chatId: string | null | undefined,
  options?: {
    enabled?: boolean;
    kind?: "image";
    limit?: number;
  },
) => {
  const { enabled = true, kind = "image", limit = 50 } = options ?? {};
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages.media(chatId ?? "", kind);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api.chats.getMedia(chatId ?? "", {
        kind,
        limit,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    enabled: Boolean(chatId) && enabled,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_before ?? undefined) : undefined,
  });

  useEffect(() => {
    if (!chatId || !enabled) return;

    let isActive = true;

    void loadCachedChatMedia(chatId, kind).then((cached) => {
      if (!isActive || !cached) return;

      const existing = queryClient.getQueryData(queryKey);
      if (existing) return;

      queryClient.setQueryData(queryKey, {
        pages: [cached.page],
        pageParams: [undefined],
      });

      if (Date.now() - cached.updatedAt > 30_000) {
        void queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => {
      isActive = false;
    };
  }, [chatId, enabled, kind, queryClient, queryKey]);

  useEffect(() => {
    if (!chatId || !query.data?.pages?.length) return;

    void saveCachedChatMedia(chatId, kind, query.data.pages[0]);
  }, [chatId, kind, query.data?.pages]);

  return query;
};
