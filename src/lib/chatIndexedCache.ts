import type { ChatMediaPage, Message } from "../types";
import { idbGet, idbSet } from "./indexedDb";

const MESSAGE_CACHE_PREFIX = "chat-messages:";
const MEDIA_CACHE_PREFIX = "chat-media:";
const MESSAGE_CACHE_LIMIT = 400;
const MEDIA_CACHE_LIMIT = 180;

type CachedMessagesPayload = {
  updatedAt: number;
  messages: Message[];
};

type CachedMediaPayload = {
  updatedAt: number;
  page: ChatMediaPage;
};

const getCurrentUserScope = () => {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  const token = window.localStorage.getItem("access_token");
  if (!token) return "anonymous";

  try {
    const payload = JSON.parse(window.atob(token.split(".")[1])) as {
      sub?: string;
    };

    return payload.sub ?? "anonymous";
  } catch {
    return "anonymous";
  }
};

const buildScopedKey = (prefix: string, suffix: string) =>
  `${prefix}${getCurrentUserScope()}:${suffix}`;

const trimMessages = (messages: Message[]) =>
  messages.slice(Math.max(0, messages.length - MESSAGE_CACHE_LIMIT));

const trimMediaPage = (page: ChatMediaPage): ChatMediaPage => {
  const items = page.items.slice(0, MEDIA_CACHE_LIMIT);

  return {
    ...page,
    items,
    next_before: items[items.length - 1]?.message_id ?? page.next_before,
  };
};

export const loadCachedChatMessages = async (chatId: string) =>
  idbGet<CachedMessagesPayload>(buildScopedKey(MESSAGE_CACHE_PREFIX, chatId));

export const saveCachedChatMessages = async (
  chatId: string,
  messages: Message[],
) =>
  idbSet<CachedMessagesPayload>(buildScopedKey(MESSAGE_CACHE_PREFIX, chatId), {
    updatedAt: Date.now(),
    messages: trimMessages(messages),
  });

export const loadCachedChatMedia = async (chatId: string, kind: "image") =>
  idbGet<CachedMediaPayload>(
    buildScopedKey(MEDIA_CACHE_PREFIX, `${kind}:${chatId}`),
  );

export const saveCachedChatMedia = async (
  chatId: string,
  kind: "image",
  page: ChatMediaPage,
) =>
  idbSet<CachedMediaPayload>(
    buildScopedKey(MEDIA_CACHE_PREFIX, `${kind}:${chatId}`),
    {
    updatedAt: Date.now(),
    page: trimMediaPage(page),
    },
  );
