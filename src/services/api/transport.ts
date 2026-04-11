import { BASE_URL } from "./config";

export const tokens = {
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

const buildJsonHeaders = (headers?: HeadersInit) => {
  const normalizedHeaders = new Headers(headers);

  if (!normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  if (tokens.access) {
    normalizedHeaders.set("Authorization", `Bearer ${tokens.access}`);
  }

  return normalizedHeaders;
};

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };

    tokens.set(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

const redirectToLogin = () => {
  tokens.clear();
  window.location.href = "/login";
};

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = buildJsonHeaders(options.headers);

  let response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && tokens.refresh) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      headers.set("Authorization", `Bearer ${tokens.access}`);
      response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      redirectToLogin();
      return Promise.reject(new Error("Не удалось обновить токен"));
    }
  }

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }))) as { detail?: string };

    throw new Error(error.detail || "Ошибка запроса");
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export async function requestFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers = new Headers();

  if (tokens.access) {
    headers.set("Authorization", `Bearer ${tokens.access}`);
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && tokens.refresh) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      headers.set("Authorization", `Bearer ${tokens.access}`);
      response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } else {
      redirectToLogin();
      return Promise.reject(new Error("Не удалось обновить токен"));
    }
  }

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ detail: "Неизвестная ошибка" }))) as { detail?: string };

    throw new Error(error.detail || "Ошибка загрузки файла");
  }

  return response.json() as Promise<T>;
}
