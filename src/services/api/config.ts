const DEFAULT_API_URL = "http://185.189.15.29:8010";
const DEFAULT_WS_URL = "ws://185.189.15.29:8010";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeApiUrl = (value: string) => trimTrailingSlash(value);

const normalizeWsUrl = (value: string) => {
  const normalized = trimTrailingSlash(value);

  if (normalized.startsWith("ws://") || normalized.startsWith("wss://")) {
    return normalized;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized.replace(/^http/, "ws");
  }

  return `ws://${normalized}`;
};

export const BASE_URL = normalizeApiUrl(
  import.meta.env.VITE_API_URL ?? DEFAULT_API_URL,
);

export const BASE_WS_URL = normalizeWsUrl(
  import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_URL ?? DEFAULT_WS_URL,
);
