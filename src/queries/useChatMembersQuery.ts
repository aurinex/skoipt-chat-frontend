import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { upsertUsers } from "../stores/useUserStore";

export const useChatMembersQuery = (chatId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["chat-members", chatId],
    queryFn: async () => {
      const members = await api.chats.getMembers(chatId);
      upsertUsers(members.members);
      return members;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 минут кеш
  });
};
