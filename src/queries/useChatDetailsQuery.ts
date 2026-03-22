import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";

export const useChatDetailsQuery = (chatId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.chats.detail(chatId ?? ""),
    queryFn: () => api.chats.get(chatId!),
    enabled: Boolean(chatId),
  });
