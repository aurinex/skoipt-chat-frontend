import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { type User } from "../types";
import { upsertUsers } from "../stores/useUserStore";

export const useUsersSearchQuery = (query: string) => {
  const trimmedQuery = query.trim();

  return useQuery<User[]>({
    queryKey: queryKeys.users.search(trimmedQuery),
    queryFn: async () => {
      const users = await api.users.search(trimmedQuery);
      upsertUsers(users);
      return users;
    },
    enabled: trimmedQuery.length > 0,
  });
};
