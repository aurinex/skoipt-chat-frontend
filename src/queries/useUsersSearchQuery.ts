import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { type User } from "../types";
import { upsertUsers } from "../stores/useUserStore";

const normalizeUsersSearchQuery = (query: string) =>
  query.trim().replace(/^@+/, "");

export const useUsersSearchQuery = (query: string) => {
  const trimmedQuery = normalizeUsersSearchQuery(query);

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
