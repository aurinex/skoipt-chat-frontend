import type { Chat, Message, User } from "../../types";
import { BASE_WS_URL } from "./config";
import { tokens } from "./transport";

export interface SocketEventMap {
  new_message: Message & { message?: Message };
  user_updated: {
    user: Partial<User> & Pick<User, "id">;
  };
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
    avatar_url?: string | null;
    member_count?: number;
    members?: string[];
    admins?: string[];
  };
}

class MessengerSocket {
  ws: WebSocket | null;
  listeners: Partial<
    Record<keyof SocketEventMap, Array<(data: unknown) => void>>
  >;
  reconnectDelay: number;
  shouldReconnect: boolean;
  pingInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectDelay = 1000;
    this.shouldReconnect = true;
    this.pingInterval = null;
  }

  connect() {
    if (!tokens.access) return;
    this.shouldReconnect = true;

    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.ws?.close();
    this.ws = new WebSocket(`${BASE_WS_URL}/ws?token=${tokens.access}`);

    this.ws.onopen = () => {
      console.log("WS подключён");
      this.reconnectDelay = 1000;
      this.startPing();
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as
        | ({
            event: keyof SocketEventMap;
          } & SocketEventMap[keyof SocketEventMap])
        | { event: string };

      console.log("WS Получено событие:", data.event, data);

      if (data.event in this.listeners) {
        this.emit(
          data.event as keyof SocketEventMap,
          data as SocketEventMap[keyof SocketEventMap],
        );
      }
    };

    this.ws.onclose = () => {
      this.stopPing();

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

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ event: "ping" });
      }
    }, 30000);
  }

  stopPing() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
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
        (listener) => listener !== (handler as (data: unknown) => void),
      );
    };
  }

  emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]) {
    this.listeners[event]?.forEach((handler) => handler(data));
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      if (tokens.access) {
        this.connect();
      }
      return;
    }

    this.send({ event: "typing", chat_id: chatId, is_typing: isTyping }, true);
  }

  sendRead(chatId: string, messageId: string | number) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      if (tokens.access) {
        this.connect();
      }
      return;
    }

    this.send(
      { event: "read", chat_id: chatId, last_message_id: messageId },
      true,
    );
  }

  private send(data: unknown, silent = false) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === "string" ? data : JSON.stringify(data));
    } else if (!silent) {
      console.warn("Попытка отправки сообщения в закрытый сокет", data);
    }
  }
}

export const socket = new MessengerSocket();
