export type TabKey = "home" | "messages" | "friends" | "apps";

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url: string | null;
  is_online: boolean;
  role: string;
  group?: string | null;
  course?: number | null;
  specialty?: string | null;
}

export interface MiniApps {
  id: string;
  name: string;
  url: string;
  description: string;
  is_active: boolean;
}

export interface ReplyToMessage {
  id: string;
  sender_id: string;
  sender?: User | null;
  text: string | null;
}

export interface ForwardedFrom {
  message_id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender?: User | null;
  text: string | null;
  file_urls: string[];
  file_url?: string | null;
  reply_to: string | null;
  reply_to_message?: ReplyToMessage | null;
  forwarded_from?: ForwardedFrom | null;
  is_edited: boolean;
  is_mine: boolean;
  is_read?: boolean;
  is_system?: boolean;
  created_at: string;
  edited_at: string | null;
  read_by: { user_id: string; read_at: string }[];
  _pending?: boolean;
  _failed?: boolean;
  _uploading?: boolean;
  _nonImageCount?: number;
}

export interface Chat {
  id: string;
  type: "direct" | "group" | "channel";
  name: string | null;
  member_count?: number;
  members?: string[];
  admins?: string[];
  avatar_url?: string;
  unread_count?: number;
  last_message?: Message | null;
  interlocutor?: User | null;
  is_typing?: boolean;
}

export interface ChatPreview {
  chat_id: string | null;
  type: "direct";
  avatar_url: string;
  interlocutor: User;
}

export interface TypingUser {
  user_id: string;
  first_name?: string;
  last_name?: string;
}

export interface ChatData {
  id: string;
  type: "direct" | "group" | "channel";
  name?: string | null;
  member_count?: number;
  avatar_url?: string;
  members?: string[];
  admins?: string[];
  interlocutor?: User | null;
}
