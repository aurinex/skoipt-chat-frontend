import type { Chat, TypingUser, User } from "../types";
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
  const fullNameParts = user.full_name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const fullNameFirst = fullNameParts[0];
  const fullNameLastInitial = fullNameParts[1]?.[0];

  if (firstName && lastInitial) return `${firstName} ${lastInitial}.`;
  if (firstName && fullNameLastInitial) return `${firstName} ${fullNameLastInitial}.`;
  if (fullNameFirst && fullNameLastInitial) return `${fullNameFirst} ${fullNameLastInitial}.`;
  if (firstName) return firstName;
  if (fullNameFirst) return fullNameFirst;
  return user.username || fallback;
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

export const getTypingStatusText = (typingUsers: TypingUser[] = []) => {
  if (typingUsers.length === 0) return null;

  const hasNames = typingUsers.every((user) => user.first_name);
  if (!hasNames) {
    return typingUsers.length > 1
      ? "Несколько человек печатают..."
      : "Печатает...";
  }

  const names = typingUsers.map(
    (user) =>
      `${user.first_name}${user.last_name ? ` ${user.last_name[0]}.` : ""}`,
  );

  if (names.length === 1) return `${names[0]} печатает...`;
  if (names.length === 2) return `${names[0]} и ${names[1]} печатают...`;
  return `${names[0]}, ${names[1]} и еще ${names.length - 2} печатают...`;
};

export const getUserPresenceText = (
  user: ResolvableUser,
  fallback = "был(а) недавно",
  onlineLabel = "В сети",
) => {
  if (!user) return "Загрузка данных...";
  return user.is_online ? onlineLabel : fallback;
};

export const getUserSubtitle = (
  user: ResolvableUser,
  options?: {
    includeUsername?: boolean;
    includeGroup?: boolean;
    separator?: string;
    fallback?: string;
  },
) => {
  const {
    includeUsername = true,
    includeGroup = true,
    separator = " · ",
    fallback = "",
  } = options ?? {};

  if (!user) return fallback;

  const parts: string[] = [];

  if (includeUsername && user.username) {
    parts.push(`@${user.username}`);
  }

  if (includeGroup && user.group) {
    parts.push(user.group);
  }

  return parts.join(separator) || fallback;
};
