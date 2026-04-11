import type { User } from "../../types";
import { BASE_URL } from "./config";
import { request, tokens } from "./transport";

export const auth = {
  async getMe() {
    return request<User>("/auth/me");
  },

  async register({
    username,
    email,
    password,
    invite_code,
  }: {
    username: string;
    email: string;
    password: string;
    invite_code?: string;
  }) {
    const data = await request<{ access_token: string; refresh_token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, email, password, invite_code }),
      },
    );

    tokens.set(data.access_token, data.refresh_token);
    return data;
  },

  async login({ username, password }: { username: string; password: string }) {
    const form = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!res.ok) {
      const err = (await res.json()) as { detail?: string };
      throw new Error(err.detail || "Неверный логин или пароль");
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };

    tokens.set(data.access_token, data.refresh_token);
    return data;
  },

  async logout() {
    await request("/auth/logout", { method: "POST" });
    tokens.clear();
  },

  async checkInvite(code: string) {
    return request(`/auth/invite/${code}/info`);
  },

  async createInvite({
    max_uses = null,
    expires_in_hours = 72,
    role = "student",
    label = null,
  }: {
    max_uses?: number | null;
    expires_in_hours?: number;
    role?: string;
    label?: string | null;
  }) {
    return request("/auth/invite/create", {
      method: "POST",
      body: JSON.stringify({ max_uses, expires_in_hours, role, label }),
    });
  },

  async listInvites() {
    return request("/auth/invites");
  },

  async deactivateInvite(code: string) {
    return request(`/auth/invite/${code}`, { method: "DELETE" });
  },
};
