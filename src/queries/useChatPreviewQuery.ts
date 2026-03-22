import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";

export const useChatPreviewQuery = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.chats.preview(userId ?? ""),
    queryFn: () => api.users.chatPreview(userId!),
    enabled: Boolean(userId),
  });
