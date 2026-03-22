import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";

export const useUsersSearchQuery = (query: string) => {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: queryKeys.users.search(trimmedQuery),
    queryFn: () => api.users.search(trimmedQuery),
    enabled: trimmedQuery.length > 0,
  });
};
