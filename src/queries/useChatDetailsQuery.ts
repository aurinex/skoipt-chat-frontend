import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { collectUsersFromChatData, upsertUsers } from "../stores/useUserStore";

export const useChatDetailsQuery = (chatId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.chats.detail(chatId ?? ""),
    queryFn: async () => {
      const chat = await api.chats.get(chatId!);
      upsertUsers(collectUsersFromChatData(chat));
      return chat;
    },
    enabled: Boolean(chatId),
  });
