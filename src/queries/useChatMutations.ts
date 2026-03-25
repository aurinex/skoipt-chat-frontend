import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import type { Chat } from "../types";
import { normalizeChat } from "./chatListCache";

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.chats.createGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists });
    },
  });
};

export const useCreateChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.chats.createChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists });
    },
  });
};

export const useSendFirstMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetUserId,
      data,
    }: {
      targetUserId: string;
      data: { text?: string | null; file_urls?: string[] };
    }) => api.chats.sendFirstMessage(targetUserId, data),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists });
      queryClient.setQueryData(
        queryKeys.messages.list(result.chat_id),
        {
          pages: [[result.message]],
          pageParams: [undefined],
        },
      );
    },
  });
};

export const useOpenDirectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.chats.openDirect,
    onSuccess: async (chat) => {
      queryClient.setQueryData(queryKeys.chats.detail(chat.id), chat);
      queryClient.setQueriesData(
        { queryKey: queryKeys.chats.lists },
        (current: Chat[] | undefined) => {
          const list = current ?? [];
          if (list.some((item) => String(item.id) === String(chat.id))) {
            return list;
          }

          return [normalizeChat(chat), ...list];
        },
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists });
    },
  });
};

export const useSendMessageMutation = () =>
  useMutation({
    mutationFn: ({
      chatId,
      data,
    }: {
      chatId: string;
      data: { text?: string | null; file_urls?: string[]; reply_to?: string | null };
    }) => api.messages.send(chatId, data),
  });
