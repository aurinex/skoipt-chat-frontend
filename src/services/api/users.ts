import type { ChatPreview, User } from "../../types";
import { request } from "./transport";

export const users = {
  async search(q: string) {
    return request<User[]>(`/users/search?q=${encodeURIComponent(q)}`);
  },

  async updateMe(data: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    course?: number | null;
    group?: string | null;
    specialty?: string | null;
    specialty_code?: string | null;
  }) {
    return request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async checkUsernameAvailability(username: string) {
    return request<{
      username: string;
      normalized_username: string;
      available: boolean;
      reason: "invalid_format" | "already_taken" | null;
    }>(
      `/users/username-availability?username=${encodeURIComponent(username)}`,
    );
  },

  async chatPreview(userId: string) {
    return request<ChatPreview>(`/users/${userId}/chat-preview`);
  },
};
