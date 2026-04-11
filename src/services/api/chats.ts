import type { Attachment, Chat, ChatData, ChatMediaPage, Message, User } from "../../types";
import { request } from "./transport";

let chatsTypeFilterSupported: boolean | null = null;

export const chats = {
  async list(type = "all") {
    if (type === "all" || chatsTypeFilterSupported === false) {
      return request<Chat[]>("/chats/");
    }

    try {
      const result = await request<Chat[]>(
        `/chats/?type=${encodeURIComponent(type)}`,
      );
      chatsTypeFilterSupported = true;
      return result;
    } catch {
      chatsTypeFilterSupported = false;
      return request<Chat[]>("/chats/");
    }
  },

  async get(chatId: string) {
    return request<ChatData>(`/chats/${chatId}`);
  },

  async openDirect(targetUserId: string) {
    return request<Chat>(`/chats/direct/${targetUserId}`, { method: "POST" });
  },

  async sendFirstMessage(
    targetUserId: string,
    data: {
      text?: string | null;
      type?: Message["type"];
      attachments?: Attachment[];
      file_urls?: string[];
    },
  ) {
    return request<{ chat_id: string; message: Message; is_new_chat: boolean }>(
      `/chats/direct/${targetUserId}/message`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  async createGroup({
    name,
    member_ids = [],
  }: {
    name: string;
    member_ids?: string[];
  }) {
    return request("/chats/group", {
      method: "POST",
      body: JSON.stringify({ name, member_ids }),
    });
  },

  async createChannel({
    name,
    description = null,
  }: {
    name: string;
    description?: string | null;
  }) {
    return request("/chats/channel", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  async addMember(chatId: string, targetUserId: string) {
    return request(`/chats/${chatId}/members/${targetUserId}`, {
      method: "POST",
    });
  },

  async kickMember(chatId: string, targetUserId: string) {
    return request(`/chats/${chatId}/members/${targetUserId}`, {
      method: "DELETE",
    });
  },

  async leave(chatId: string) {
    return request(`/chats/${chatId}/leave`, { method: "DELETE" });
  },

  async read(chatId: string) {
    return request<{ detail: string }>(`/chats/${chatId}/read`, {
      method: "POST",
    });
  },

  async getMembers(chatId: string, limit = 50, offset = 0) {
    return request<{
      members: (User & { is_admin: boolean })[];
      total: number;
      limit: number;
      offset: number;
    }>(`/chats/${chatId}/members?limit=${limit}&offset=${offset}`);
  },

  async getMedia(
    chatId: string,
    {
      kind = "image",
      limit = 50,
      before,
    }: {
      kind?: "image";
      limit?: number;
      before?: string;
    } = {},
  ) {
    const params = new URLSearchParams({
      kind,
      limit: String(limit),
    });

    if (before) {
      params.set("before", before);
    }

    return request<ChatMediaPage>(`/chats/${chatId}/media?${params.toString()}`);
  },

  async makeAdmin(chatId: string, targetUserId: string) {
    return request(`/chats/${chatId}/admin/${targetUserId}`, {
      method: "POST",
    });
  },

  async revokeAdmin(chatId: string, targetUserId: string) {
    return request(`/chats/${chatId}/admin/${targetUserId}`, {
      method: "DELETE",
    });
  },
};
