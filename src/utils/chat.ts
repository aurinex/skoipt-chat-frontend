import type { Chat, ChatData, ChatPreview } from "../types";
import type { UserSnapshot } from "../stores/useUserStore";
import { getUserAvatarUrl, getUserDisplayName, resolveUser } from "./user";

type UserRecord = Record<string, UserSnapshot>;
type ChatLike = Chat | ChatData | ChatPreview | null | undefined;

export const getChatInterlocutor = (
  chat: ChatLike,
  usersById?: UserRecord,
) => resolveUser(chat?.interlocutor, usersById);

export const getChatTitle = (
  chat: ChatLike,
  usersById?: UserRecord,
  fallback = "Пользователь",
) => {
  if (!chat) return null;
  if ("name" in chat && chat.name) return chat.name;

  return getUserDisplayName(getChatInterlocutor(chat, usersById), fallback);
};

export const getChatAvatarUrl = (chat: ChatLike, usersById?: UserRecord) => {
  if (!chat) return undefined;
  if (chat.type === "direct") {
    return getUserAvatarUrl(getChatInterlocutor(chat, usersById));
  }

  return "avatar_url" in chat ? chat.avatar_url ?? undefined : undefined;
};
