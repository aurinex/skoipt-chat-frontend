import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { upsertUser } from "../stores/useUserStore";

export const useMeQuery = () =>
  useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const me = await api.auth.getMe();
      upsertUser(me);
      return me;
    },
  });
