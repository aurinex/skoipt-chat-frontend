import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";

export const useMeQuery = () =>
  useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.auth.getMe(),
  });
