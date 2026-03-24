import type {
  Chat,
  ChatData,
  ChatPreview,
  Message,
  User,
  MiniApps,
} from "../types";

// const BASE_URL = "http://localhost:8000";
// const BASE_WS = "localhost:8000";
const BASE_URL = "http://10.10.10.5:8000";
const BASE_WS = "10.10.10.5:8000";
// const BASE_URL = "http://192.168.51.143:8000";
// const BASE_WS = "192.168.51.143:8000";

export interface SocketEventMap {
  new_message: Message & { message?: Message };
  typing: {
    chat_id: string;
    user_id: string;
    is_typing: boolean;
    first_name?: string;
    last_name?: string;
  };
  read: {
    chat_id: string;
    message_ids: string[];
    user_id: string;
    read_at: string;
  };
  unread_count: {
    chat_id: string;
    unread_count: number;
  };
  new_chat: {
    chat: Chat;
  };
  kicked: {
    chat_id: string;
  };
  left_chat: {
    chat_id: string;
  };
  message_edited: {
    chat_id: string;
    message_id: string;
    text: string | null;
    edited_at: string | null;
  };
  message_deleted: {
    chat_id: string;
    message_id: string;
  };
  chat_updated: {
    chat_id: string;
    member_count?: number;
    members?: string[];
    admins?: string[];
  };
}

const tokens = {
  get access() {
    return localStorage.getItem("access_token");
  },
  get refresh() {
    return localStorage.getItem("refresh_token");
  },
  set(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

export function getMyId(): string | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  let response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && tokens.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
      response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      tokens.clear();
      window.location.href = "/login";
      return Promise.reject(new Error("Не удалось обновить токен"));
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }));
    throw new Error(error.detail || "Ошибка запроса");
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

async function requestFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  let response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && tokens.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
      response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } else {
      tokens.clear();
      window.location.href = "/login";
      return Promise.reject(new Error("Не удалось обновить токен"));
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }));
    throw new Error(error.detail || "Ошибка загрузки файла");
  }

  return response.json() as Promise<T>;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokens.set(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

const auth = {
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
      const err = await res.json();
      throw new Error(err.detail || "Неверный логин или пароль");
    }
    const data = await res.json();
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

// ─── Users ───────────────────────────────────────────────────────────────────

const users = {
  async search(q: string) {
    return request<User[]>(`/users/search?q=${encodeURIComponent(q)}`);
  },

  // Возвращает { chat_id, type, interlocutor }
  // chat_id === null если чата ещё нет — чат в БД НЕ создаётся
  async chatPreview(userId: string) {
    return request<ChatPreview>(`/users/${userId}/chat-preview`);
  },
};

// ─── Chats ───────────────────────────────────────────────────────────────────

const chats = {
  async list() {
    return request<Chat[]>("/chats/");
  },
  async get(chatId: string) {
    return request<ChatData>(`/chats/${chatId}`);
  },
  async openDirect(targetUserId: string) {
    return request<Chat>(`/chats/direct/${targetUserId}`, { method: "POST" });
  },

  // Создаёт чат если нет + отправляет первое сообщение за один запрос
  // Возвращает { chat_id, message, is_new_chat }
  async sendFirstMessage(
    targetUserId: string,
    data: { text?: string | null; file_urls?: string[] },
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

  async getMembers(chatId: string, limit = 50, offset = 0) {
    return request<{
      members: (User & { is_admin: boolean })[];
      total: number;
      limit: number;
      offset: number;
    }>(`/chats/${chatId}/members?limit=${limit}&offset=${offset}`);
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

// ─── Messages ────────────────────────────────────────────────────────────────

const messages = {
  async list(chatId: string) {
    return request<Message[]>(`/chats/${chatId}/messages/`);
  },
  async loadMore(chatId: string, beforeId: string) {
    return request<Message[]>(
      `/chats/${chatId}/messages/?before_id=${beforeId}`,
    );
  },

  async send(
    chatId: string,
    {
      text = null,
      file_urls = [],
      reply_to = null,
    }: { text?: string | null; file_urls?: string[]; reply_to?: string | null },
  ) {
    return request<Message>(`/chats/${chatId}/messages/`, {
      method: "POST",
      body: JSON.stringify({ text, file_urls, reply_to }),
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

// ─── Files ───────────────────────────────────────────────────────────────────

const files = {
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<{
      url: string;
      object_name: string;
      is_public: boolean;
    }>("/files/avatar", formData);
  },

  async uploadChatAvatar(chatId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<{
      avatar_url: string;
    }>(`/files/chat/${chatId}/avatar`, formData);
  },

  async uploadChatFile(chatId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<{
      url: string;
      object_name: string;
      is_public: boolean;
    }>(`/files/chat/${chatId}`, formData);
  },

  async getPrivateUrl(chatId: string, objectName: string) {
    return request<{ url: string }>(`/files/chat/${chatId}/${objectName}`);
  },
};

// ─── MINIAPPS ───────────────────────────────────────────────────────────────

const miniApps = {
  async get() {
    return request<MiniApps[]>(`/mini-apps/`);
  },
  async launch(appId: string) {
    return request<{ url: string; token: string }>(
      `/mini-apps/${appId}/launch`,
      {
        method: "POST",
      },
    );
  },
};

// ─── WebSocket ───────────────────────────────────────────────────────────────

class MessengerSocket {
  ws: WebSocket | null;
  listeners: Partial<
    Record<keyof SocketEventMap, Array<(data: unknown) => void>>
  >;
  reconnectDelay: number;
  shouldReconnect: boolean;
  _pingInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectDelay = 1000;
    this.shouldReconnect = true;
    this._pingInterval = null;
  }

  connect() {
    this.ws?.close();
    if (!tokens.access) return;
    this.ws = new WebSocket(`ws://${BASE_WS}/ws?token=${tokens.access}`);

    this.ws.onopen = () => {
      console.log("WS подключён");
      this.reconnectDelay = 1000;
      this._startPing();
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as
        | ({
            event: keyof SocketEventMap;
          } & SocketEventMap[keyof SocketEventMap])
        | { event: string };
      console.log("WS Получено событие:", data.event, data);
      if (data.event in this.listeners) {
        this._emit(
          data.event as keyof SocketEventMap,
          data as SocketEventMap[keyof SocketEventMap],
        );
      }
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (this.shouldReconnect) {
        console.log(
          `WS отключён, переподключение через ${this.reconnectDelay}мс...`,
        );
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      }
    };

    this.ws.onerror = (err: Event) => {
      console.error("WS ошибка:", err);
    };
  }

  _startPing() {
    this._pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this._send({ event: "ping" });
      }
    }, 30000); // каждые 30 секунд
  }

  _stopPing() {
    if (this._pingInterval !== null) {
      clearInterval(this._pingInterval);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }

  on<K extends keyof SocketEventMap>(
    event: K,
    handler: (data: SocketEventMap[K]) => void,
  ) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler as (data: unknown) => void);
    return () => {
      this.listeners[event] = this.listeners[event]?.filter(
        (h) => h !== (handler as (data: unknown) => void),
      );
    };
  }

  _emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]) {
    this.listeners[event]?.forEach((handler) => handler(data));
  }
  sendTyping(chatId: string, isTyping: boolean) {
    this._send({ event: "typing", chat_id: chatId, is_typing: isTyping });
  }
  sendRead(chatId: string, messageId: string | number) {
    this._send({ event: "read", chat_id: chatId, last_message_id: messageId });
  }

  _send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
    } else {
      console.warn("Попытка отправки сообщения в закрытый сокет", data);
    }
  }
}

export const socket = new MessengerSocket();

const api = { auth, chats, messages, files, users, miniApps };
export default api;
