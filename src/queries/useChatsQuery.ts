import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import api from "../services/api";
import { normalizeChats } from "./chatListCache";
import { collectUsersFromChats, upsertUsers } from "../stores/useUserStore";
import type { Chat } from "../types";

const parseChatTypes = (type: string): Chat["type"][] => {
  if (!type || type === "all") {
    return ["direct", "group", "channel"];
  }

  return type
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item): item is Chat["type"] =>
        item === "direct" || item === "group" || item === "channel",
    );
};

const filterChatsByType = (chats: Chat[], type: string) => {
  const allowedTypes = parseChatTypes(type);

  if (allowedTypes.length === 0 || allowedTypes.length === 3) {
    return chats;
  }

  return chats.filter((chat) => allowedTypes.includes(chat.type));
};

export const useChatsQuery = (type = "all") =>
  useQuery({
    queryKey: queryKeys.chats.list(type),
    queryFn: async () => {
      const chats = await api.chats.list(type);
      upsertUsers(collectUsersFromChats(chats));
      return chats;
    },
    select: (chats) => filterChatsByType(normalizeChats(chats), type),
  });
