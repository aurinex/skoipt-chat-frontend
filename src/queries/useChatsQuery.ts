import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { normalizeChats } from "./chatListCache";

export const useChatsQuery = () =>
  useQuery({
    queryKey: queryKeys.chats.all,
    queryFn: () => api.chats.list(),
    select: normalizeChats,
  });
