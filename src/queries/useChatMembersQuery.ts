import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useChatMembersQuery = (chatId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["chat-members", chatId],
    queryFn: () => api.chats.getMembers(chatId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 минут кеш
  });
};
