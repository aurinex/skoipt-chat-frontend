import type { Chat, User } from "../types";
import type { UserSnapshot } from "../stores/useUserStore";

type UserRecord = Record<string, UserSnapshot>;
type ResolvableUser = UserSnapshot | User | null | undefined;

export const resolveUser = (
  user: ResolvableUser,
  usersById?: UserRecord,
): UserSnapshot | undefined => {
  if (!user?.id) return undefined;

  return {
    ...(user ?? {}),
    ...(usersById?.[user.id] ?? {}),
  };
};

export const getUserDisplayName = (
  user: ResolvableUser,
  fallback = "Пользователь",
) => {
  if (!user) return fallback;
  if (user.full_name?.trim()) return user.full_name;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || fallback;
};

export const getUserShortName = (
  user: ResolvableUser,
  fallback = "Ответ",
) => {
  if (!user) return fallback;

  const firstName = user.first_name?.trim();
  const lastInitial = user.last_name?.trim()?.[0];

  if (firstName && lastInitial) return `${firstName} ${lastInitial}.`;
  if (firstName) return firstName;
  return getUserDisplayName(user, fallback);
};

export const getUserAvatarUrl = (user: ResolvableUser) =>
  user?.avatar_url ?? undefined;

export const getUserInitial = (user: ResolvableUser, fallback = "?") =>
  user?.first_name?.trim()?.[0] || user?.username?.trim()?.[0] || fallback;

export const getChatDisplayName = (
  chat: Pick<Chat, "name" | "interlocutor">,
  usersById?: UserRecord,
  fallback = "Пользователь",
) => {
  if (chat.name) return chat.name;
  return getUserDisplayName(resolveUser(chat.interlocutor, usersById), fallback);
};
