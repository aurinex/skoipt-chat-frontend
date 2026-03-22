import { useRef } from "react";
import type { Message } from "../types";

/**
 * Кеш сообщений — живёт вне компонентов, сохраняется между переходами.
 * Map<chatId, Message[]>
 */
const messagesCache = new Map<string, Message[]>();

export const useMessagesCache = () => {
  const cacheRef = useRef(messagesCache);

  const get = (chatId: string): Message[] | undefined => {
    return cacheRef.current.get(chatId);
  };

  const set = (chatId: string, messages: Message[]): void => {
    cacheRef.current.set(chatId, messages);
  };

  const update = (
    chatId: string,
    updater: (prev: Message[]) => Message[],
  ): void => {
    const current = cacheRef.current.get(chatId) ?? [];
    cacheRef.current.set(chatId, updater(current));
  };

  const invalidate = (chatId: string): void => {
    cacheRef.current.delete(chatId);
  };

  return { get, set, update, invalidate };
};
