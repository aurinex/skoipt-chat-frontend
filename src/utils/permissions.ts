import type { ChatData } from "../types";
import { isChatAdmin, isCurrentUserChatAdmin } from "./user";

type ChatMemberLike = { id?: string; is_admin?: boolean } | null | undefined;

export const canSendToChat = (
  chat: ChatData | null | undefined,
  currentUserId: string | null | undefined,
  members?: ChatMemberLike[],
) => {
  if (!chat || !currentUserId) return true;
  if (chat.type !== "channel") return true;
  return isCurrentUserChatAdmin(members, currentUserId);
};

export const canManageChat = (
  chat: ChatData | null | undefined,
  currentUserId: string | null | undefined,
  members?: ChatMemberLike[],
) => {
  if (!chat || !currentUserId) return false;
  if (chat.type === "direct") return false;
  return isCurrentUserChatAdmin(members, currentUserId);
};

export const canEditChatAvatar = canManageChat;

export const canInviteMembers = canManageChat;

export const canManageChatMember = (
  currentUserId: string | null | undefined,
  targetMember: ChatMemberLike,
  members?: ChatMemberLike[],
) => {
  if (!currentUserId || !targetMember?.id) return false;
  if (!isCurrentUserChatAdmin(members, currentUserId)) return false;
  return String(targetMember.id) !== String(currentUserId);
};

export const canPromoteChatMember = canManageChatMember;

export const canKickChatMember = canManageChatMember;

export const canRevokeChatAdmin = (
  currentUserId: string | null | undefined,
  targetMember: ChatMemberLike,
  members?: ChatMemberLike[],
) => {
  if (!isChatAdmin(targetMember)) return false;
  return canManageChatMember(currentUserId, targetMember, members);
};
