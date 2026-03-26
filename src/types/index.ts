export type TabKey = "home" | "messages" | "friends" | "apps";

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url: string | null;
  is_online: boolean;
  role?: string | null;
  roles?: string[];
  email?: string | null;
  group?: string | null;
  course?: number | null;
  specialty?: string | null;
  specialty_code?: string | null;
  is_bot?: boolean;
  created_at?: string | null;
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

export type AttachmentKind = "file" | "image" | "voice";
export type MessageType = "text" | "file" | "image" | "voice" | "system";

export interface AttachmentPreview {
  url?: string | null;
  object_name?: string | null;
  is_public?: boolean;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Attachment {
  kind: AttachmentKind;
  url?: string | null;
  object_name?: string | null;
  is_public?: boolean;
  mime_type?: string | null;
  filename?: string | null;
  size_bytes?: number | null;
  duration_ms?: number | null;
  waveform?: number[] | null;
  width?: number | null;
  height?: number | null;
  preview?: AttachmentPreview | null;
}

export interface ChatMediaItem {
  message_id: string;
  chat_id: string;
  created_at: string;
  sender_id: string;
  attachment: Attachment;
}

export interface ChatMediaPage {
  items: ChatMediaItem[];
  limit: number;
  has_more: boolean;
  next_before: string | null;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender?: User | null;
  type?: MessageType;
  text: string | null;
  attachments?: Attachment[];
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
  unread_count?: number;
}
