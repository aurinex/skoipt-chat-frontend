import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { normalizeChats } from "./chatListCache";
import { collectUsersFromChats, upsertUsers } from "../stores/useUserStore";

export const useChatsQuery = () =>
  useQuery({
    queryKey: queryKeys.chats.all,
    queryFn: async () => {
      const chats = await api.chats.list();
      upsertUsers(collectUsersFromChats(chats));
      return chats;
    },
    select: normalizeChats,
  });
