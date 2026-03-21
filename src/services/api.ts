// api.js — единый API-клиент для мессенджера
// Использование: import api from './api'

// const BASE_URL = "http://localhost:8000";
// const BASE_WS = "localhost:8000";
const BASE_URL = "http://10.10.10.5:8000";
const BASE_WS = "10.10.10.5:8000";

// ─── Хранение токенов ────────────────────────────────────────────────────────

const tokens = {
  get access() {
    return localStorage.getItem("access_token");
  },
  get refresh() {
    return localStorage.getItem("refresh_token");
  },
  set(access, refresh) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// ─── Базовый fetch с авто-рефрешем токена ───────────────────────────────────

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (tokens.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  let response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Токен истёк — пробуем обновить и повторить запрос
  if (response.status === 401 && tokens.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
      response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      tokens.clear();
      window.location.href = "/login";
      return;
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }));
    throw new Error(error.detail || "Ошибка запроса");
  }

  // 204 No Content — возвращаем null
  if (response.status === 204) return null;

  return response.json();
}

// Отдельная функция для multipart/form-data запросов (загрузка файлов)
// НЕ устанавливаем Content-Type — браузер сам проставит с boundary
async function requestFormData(path, formData) {
  const headers: Record<string, string> = {};

  if (tokens.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

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
      return;
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }));
    throw new Error(error.detail || "Ошибка загрузки файла");
  }

  return response.json();
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
    return request("/auth/me");
  },

  async register({ username, email, password, invite_code }) {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, invite_code }),
    });
    tokens.set(data.access_token, data.refresh_token);
    return data;
  },

  async login({ username, password }) {
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

  async checkInvite(code) {
    return request(`/auth/invite/${code}/info`);
  },

  async createInvite({
    max_uses = null,
    expires_in_hours = 72,
    role = "student",
    label = null,
  }) {
    return request("/auth/invite/create", {
      method: "POST",
      body: JSON.stringify({ max_uses, expires_in_hours, role, label }),
    });
  },

  async listInvites() {
    return request("/auth/invites");
  },

  async deactivateInvite(code) {
    return request(`/auth/invite/${code}`, { method: "DELETE" });
  },
};

// ─── Chats ───────────────────────────────────────────────────────────────────

const chats = {
  async list() {
    return request("/chats/");
  },

  async get(chatId) {
    return request(`/chats/${chatId}`);
  },

  async openDirect(targetUserId) {
    return request(`/chats/direct/${targetUserId}`, { method: "POST" });
  },

  async createGroup({ name, member_ids = [] }) {
    return request("/chats/group", {
      method: "POST",
      body: JSON.stringify({ name, member_ids }),
    });
  },

  async createChannel({ name, description = null }) {
    return request("/chats/channel", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  async addMember(chatId, targetUserId) {
    return request(`/chats/${chatId}/members/${targetUserId}`, {
      method: "POST",
    });
  },

  async kickMember(chatId, targetUserId) {
    return request(`/chats/${chatId}/members/${targetUserId}`, {
      method: "DELETE",
    });
  },

  async leave(chatId) {
    return request(`/chats/${chatId}/leave`, { method: "DELETE" });
  },
};

// ─── Messages ────────────────────────────────────────────────────────────────

const messages = {
  async list(chatId) {
    return request(`/chats/${chatId}/messages/`);
  },

  async loadMore(chatId, beforeId) {
    return request(`/chats/${chatId}/messages/?before_id=${beforeId}`);
  },

  async send(chatId, { text = null, file_urls = [], reply_to = null }) {
    return request(`/chats/${chatId}/messages/`, {
      method: "POST",
      body: JSON.stringify({ text, file_urls, reply_to }),
    });
  },

  async edit(chatId, messageId, text) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    });
  },

  async delete(chatId, messageId) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "DELETE",
    });
  },
};

// ─── Files ───────────────────────────────────────────────────────────────────

const files = {
  // Загрузить аватар текущего пользователя
  // Возвращает { avatar_url: "http://..." }
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData("/files/avatar", formData);
  },

  // Загрузить файл в чат
  // Канал → { url, is_public: true }
  // Личка/группа → { object_name, is_public: false }
  async uploadChatFile(chatId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData(`/files/chat/${chatId}`, formData);
  },

  // Получить временную ссылку на приватный файл (живёт 1 час)
  // Возвращает { url, expires_in: 3600 }
  async getPrivateUrl(chatId: string, objectName: string) {
    return request(`/files/chat/${chatId}/${objectName}`);
  },
};

// ─── WebSocket ───────────────────────────────────────────────────────────────

class MessengerSocket {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectDelay = 1000;
    this.shouldReconnect = true;
  }

  connect() {
    if (!tokens.access) return;

    this.ws = new WebSocket(`ws://${BASE_WS}/ws?token=${tokens.access}`);

    this.ws.onopen = () => {
      console.log("WS подключён");
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Получено событие:", data.event, data);
      this._emit(data.event, data);
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        console.log(
          `WS отключён, переподключение через ${this.reconnectDelay}мс...`,
        );
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WS ошибка:", err);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (h) => h !== handler,
      );
    };
  }

  _emit(event, data) {
    this.listeners[event]?.forEach((handler) => handler(data));
  }

  sendTyping(chatId, isTyping) {
    this._send({ event: "typing", chat_id: chatId, is_typing: isTyping });
  }

  sendRead(chatId, messageId) {
    this._send({
      event: "read",
      chat_id: chatId,
      last_message_id: messageId,
    });
  }

  _send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
    } else {
      console.warn("Попытка отправки сообщения в закрытый сокет", data);
    }
  }
}

export const socket = new MessengerSocket();

// ─── Экспорт ─────────────────────────────────────────────────────────────────

const api = { auth, chats, messages, files };
export default api;
