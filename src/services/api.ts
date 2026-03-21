// api.js — единый API-клиент для мессенджера
// Использование: import api from './api'

// const BASE_URL = 'http://192.168.51.84:8000'
// const BASE_WS = "192.168.51.84:8000"
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
  // Регистрация по инвайт-коду
  // invite_code берётся из URL: /register?invite=dK3mN9xQpL2wR7tY
  async register({ username, email, password, invite_code }) {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, invite_code }),
    });
    tokens.set(data.access_token, data.refresh_token);
    return data;
  },

  // Логин
  async login({ username, password }) {
    // OAuth2 требует form-data, не JSON
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

  // Проверить инвайт перед показом формы регистрации
  async checkInvite(code) {
    return request(`/auth/invite/${code}/info`);
  },

  // Создать инвайт (только для админа)
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

  // Список всех инвайтов (только для админа)
  async listInvites() {
    return request("/auth/invites");
  },

  // Деактивировать инвайт (только для админа)
  async deactivateInvite(code) {
    return request(`/auth/invite/${code}`, { method: "DELETE" });
  },
};

// ─── Chats ───────────────────────────────────────────────────────────────────

const chats = {
  // Все чаты текущего пользователя (с последним сообщением)
  async list() {
    return request("/chats/");
  },

  // Получить детальную информацию об одном чате (название, участники, и т.д.)
  async get(chatId) {
    return request(`/chats/${chatId}`);
  },

  // Открыть или создать личку с пользователем
  async openDirect(targetUserId) {
    return request(`/chats/direct/${targetUserId}`, { method: "POST" });
  },

  // Создать групповой чат
  async createGroup({ name, member_ids = [] }) {
    return request("/chats/group", {
      method: "POST",
      body: JSON.stringify({ name, member_ids }),
    });
  },

  // Создать канал (только преподаватель/админ)
  async createChannel({ name, description = null }) {
    return request("/chats/channel", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  // Добавить участника в чат (только админ чата)
  async addMember(chatId, targetUserId) {
    return request(`/chats/${chatId}/members/${targetUserId}`, {
      method: "POST",
    });
  },

  // Покинуть чат
  async leave(chatId) {
    return request(`/chats/${chatId}/leave`, { method: "DELETE" });
  },
};

// ─── Messages ────────────────────────────────────────────────────────────────

const messages = {
  // История сообщений (последние 50)
  async list(chatId) {
    return request(`/chats/${chatId}/messages/`);
  },

  // Подгрузить более старые сообщения (бесконечный скролл вверх)
  // before_id — id самого старого сообщения которое уже загружено
  async loadMore(chatId, beforeId) {
    return request(`/chats/${chatId}/messages/?before_id=${beforeId}`);
  },

  // Отправить сообщение
  async send(chatId, { text = null, file_url = null, reply_to = null }) {
    return request(`/chats/${chatId}/messages/`, {
      method: "POST",
      body: JSON.stringify({ text, file_url, reply_to }),
    });
  },

  // Редактировать сообщение
  async edit(chatId, messageId, text) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    });
  },

  // Удалить сообщение
  async delete(chatId, messageId) {
    return request(`/chats/${chatId}/messages/${messageId}`, {
      method: "DELETE",
    });
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
      this.reconnectDelay = 1000; // Сбрасываем задержку при успешном подключении
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
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Экспоненциальный backoff до 30с
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

  // Подписка на событие: on('new_message', handler)
  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    // Возвращаем функцию отписки
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (h) => h !== handler,
      );
    };
  }

  _emit(event, data) {
    this.listeners[event]?.forEach((handler) => handler(data));
  }

  // ── Отправка событий на сервер ──

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

const api = { auth, chats, messages };
export default api;

// ══════════════════════════════════════════════════════════════════════════════
// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТАХ
// ══════════════════════════════════════════════════════════════════════════════

/*

// ── Страница логина ──────────────────────────────────────────────────────────

import api from './api'

async function handleLogin(e) {
  e.preventDefault()
  try {
    await api.auth.login({ username: 'DIKER', password: 'mypassword' })
    navigate('/chats')
  } catch (err) {
    setError(err.message) // "Неверный логин или пароль"
  }
}


// ── Страница регистрации ─────────────────────────────────────────────────────

// URL: /register?invite=dK3mN9xQpL2wR7tY
const [searchParams] = useSearchParams()
const inviteCode = searchParams.get('invite')

useEffect(() => {
  // Проверяем инвайт сразу при загрузке страницы
  api.auth.checkInvite(inviteCode)
    .then(info => setInviteInfo(info))  // { valid: true, role: 'student', uses_left: 28 }
    .catch(() => setError('Инвайт недействителен'))
}, [inviteCode])

async function handleRegister(e) {
  e.preventDefault()
  await api.auth.register({ username, email, password, invite_code: inviteCode })
  navigate('/chats')
}


// ── Список чатов ─────────────────────────────────────────────────────────────

useEffect(() => {
  api.chats.list().then(setChats)
}, [])

// Подписка на новые сообщения через WebSocket
useEffect(() => {
  socket.connect()

  const unsub = socket.on('new_message', ({ message }) => {
    setChats(prev => prev.map(chat =>
      chat.id === message.chat_id
        ? { ...chat, last_message: message }
        : chat
    ))
  })

  return () => unsub() // Отписка при размонтировании
}, [])


// ── Окно чата ────────────────────────────────────────────────────────────────

// Загрузка сообщений
useEffect(() => {
  api.messages.list(chatId).then(setMessages)
}, [chatId])

// Бесконечный скролл вверх
async function loadOlderMessages() {
  const oldest = messages[0]
  const older = await api.messages.loadMore(chatId, oldest.id)
  setMessages(prev => [...older, ...prev])
}

// Отправка сообщения
async function handleSend() {
  const msg = await api.messages.send(chatId, { text: inputText })
  setMessages(prev => [...prev, msg])
  setInputText('')
}

// Ответ на сообщение
async function handleReply(replyToId) {
  const msg = await api.messages.send(chatId, {
    text: inputText,
    reply_to: replyToId
  })
  setMessages(prev => [...prev, msg])
}

// Получение новых сообщений через WebSocket
useEffect(() => {
  const unsub = socket.on('new_message', ({ message }) => {
    if (message.chat_id === chatId) {
      setMessages(prev => [...prev, message])
      socket.sendRead(message.id) // Сразу помечаем как прочитанное
    }
  })
  return () => unsub()
}, [chatId])

// Индикатор "печатает..."
useEffect(() => {
  const unsub = socket.on('typing', ({ user_id, is_typing }) => {
    if (is_typing) {
      setTypingUsers(prev => [...new Set([...prev, user_id])])
    } else {
      setTypingUsers(prev => prev.filter(id => id !== user_id))
    }
  })
  return () => unsub()
}, [])

// Отправлять typing пока пользователь пишет
let typingTimer = null
function handleInputChange(e) {
  setInputText(e.target.value)
  socket.sendTyping(chatId, true)
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => socket.sendTyping(chatId, false), 2000)
}


// ── Статус онлайн ────────────────────────────────────────────────────────────

useEffect(() => {
  const unsub = socket.on('user_status', ({ user_id, is_online }) => {
    setUsers(prev => prev.map(u =>
      u.id === user_id ? { ...u, is_online } : u
    ))
  })
  return () => unsub()
}, [])


// ── Галочки прочитано ────────────────────────────────────────────────────────

useEffect(() => {
  const unsub = socket.on('read', ({ message_id }) => {
    setMessages(prev => prev.map(m =>
      m.id === message_id ? { ...m, is_read: true } : m
    ))
  })
  return () => unsub()
}, [])


// ── Админка — создать инвайт ─────────────────────────────────────────────────

const invite = await api.auth.createInvite({
  max_uses: 30,
  expires_in_hours: 168, // неделя
  role: 'student',
  label: 'Группа ИС-21'
})
console.log(invite.invite_url) // https://college.ru/register?invite=dK3mN9xQpL2wR7tY

*/
