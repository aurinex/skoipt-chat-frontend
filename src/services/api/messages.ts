import type { Attachment, Message } from "../../types";
import { request } from "./transport";

export const messages = {
  async list(chatId: string) {
    return request<Message[]>(`/chats/${chatId}/messages/`);
  },

  async get(chatId: string, messageId: string) {
    return request<Message>(`/chats/${chatId}/messages/${messageId}`);
  },

  async getContext(
    chatId: string,
    messageId: string,
    { before = 20, after = 20 }: { before?: number; after?: number } = {},
  ) {
    const params = new URLSearchParams({
      before: String(before),
      after: String(after),
    });

    return request<{
      target: Message;
      before: Message[];
      after: Message[];
    }>(`/chats/${chatId}/messages/${messageId}/context?${params.toString()}`);
  },

  async loadMore(chatId: string, beforeId: string) {
    return request<Message[]>(`/chats/${chatId}/messages/?before_id=${beforeId}`);
  },

  async send(
    chatId: string,
    {
      text = null,
      type = "text",
      attachments = [],
      file_urls = [],
      reply_to = null,
    }: {
      text?: string | null;
      type?: Message["type"];
      attachments?: Attachment[];
      file_urls?: string[];
      reply_to?: string | null;
    },
  ) {
    return request<Message>(`/chats/${chatId}/messages/`, {
      method: "POST",
      body: JSON.stringify({ text, type, attachments, file_urls, reply_to }),
    });
  },

  async forward(chatId: string, messageId: string, targetChatId: string) {
    return request(`/chats/${chatId}/messages/${messageId}/forward`, {
      method: "POST",
      body: JSON.stringify({ target_chat_id: targetChatId }),
    });
  },

  async edit(chatId: string, messageId: string, text: string) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    });
  },

  async delete(chatId: string, messageId: string) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "DELETE",
    });
  },
};
