import { create } from "zustand";
import type { Chat, ChatData, ChatPreview, Message, ReplyToMessage, User } from "../types";

export type UserSnapshot = Partial<User> & Pick<User, "id">;

interface UserStoreState {
  usersById: Record<string, UserSnapshot>;
  upsertUser: (user: UserSnapshot | null | undefined) => void;
  upsertUsers: (users: Array<UserSnapshot | null | undefined>) => void;
}

const mergeUserSnapshots = (
  current: UserSnapshot | undefined,
  incoming: UserSnapshot,
): UserSnapshot => ({
  ...current,
  ...incoming,
  full_name: incoming.full_name ?? current?.full_name,
});

export const useUserStore = create<UserStoreState>((set) => ({
  usersById: {},

  upsertUser: (user) => {
    if (!user?.id) return;

    set((state) => ({
      usersById: {
        ...state.usersById,
        [user.id]: mergeUserSnapshots(state.usersById[user.id], user),
      },
    }));
  },

  upsertUsers: (users) => {
    const validUsers = users.filter((user): user is UserSnapshot => Boolean(user?.id));
    if (validUsers.length === 0) return;

    set((state) => {
      const nextUsersById = { ...state.usersById };

      for (const user of validUsers) {
        nextUsersById[user.id] = mergeUserSnapshots(nextUsersById[user.id], user);
      }

      return { usersById: nextUsersById };
    });
  },
}));

export const upsertUser = (user: UserSnapshot | null | undefined) =>
  useUserStore.getState().upsertUser(user);

export const upsertUsers = (users: Array<UserSnapshot | null | undefined>) =>
  useUserStore.getState().upsertUsers(users);

export const getCachedUser = (userId: string | null | undefined) =>
  userId ? useUserStore.getState().usersById[userId] : undefined;

export const mergeUserWithCache = <T extends UserSnapshot | null | undefined>(
  user: T,
  cachedUser: UserSnapshot | undefined,
) => {
  if (!user) return (cachedUser ?? user) as T;
  if (!cachedUser) return user;

  return mergeUserSnapshots(user, cachedUser) as T;
};

export const useCachedUser = <T extends UserSnapshot | null | undefined>(user: T) => {
  const cachedUser = useUserStore((state) =>
    user?.id ? state.usersById[user.id] : undefined,
  );

  return mergeUserWithCache(user, cachedUser);
};

const getReplyUsers = (reply?: ReplyToMessage | null) => [reply?.sender];

export const collectUsersFromMessages = (messages: Message[]) =>
  messages.flatMap((message) => [message.sender, ...getReplyUsers(message.reply_to_message)]);

export const collectUsersFromChats = (chats: Chat[]) =>
  chats.flatMap((chat) => [chat.interlocutor, chat.last_message?.sender]);

export const collectUsersFromChatData = (
  chatData: Chat | ChatData | ChatPreview | null | undefined,
) => [chatData?.interlocutor];
