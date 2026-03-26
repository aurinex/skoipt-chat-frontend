import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
} from "@tanstack/react-query";

const QUERY_CACHE_STORAGE_KEY = "app-query-cache-v1";
const PERSIST_DEBOUNCE_MS = 600;

const isPersistedQueryKey = (queryKey: readonly unknown[]) => {
  const [root, scope] = queryKey;

  if (root === "auth") {
    return scope === "me";
  }

  if (root === "chats") {
    return scope === "list" || scope === "detail";
  }

  return false;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const hydrateQueryClientFromStorage = () => {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return;

    hydrate(queryClient, JSON.parse(raw) as DehydratedState);
  } catch (error) {
    console.warn("Не удалось восстановить локальный query cache", error);
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  }
};

export const setupQueryCachePersistence = () => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let timeoutId: number | null = null;

  const persist = () => {
    try {
      const dehydrated = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" && isPersistedQueryKey(query.queryKey),
      });

      window.localStorage.setItem(
        QUERY_CACHE_STORAGE_KEY,
        JSON.stringify(dehydrated),
      );
    } catch (error) {
      console.warn("Не удалось сохранить локальный query cache", error);
    }
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      persist();
      timeoutId = null;
    }, PERSIST_DEBOUNCE_MS);
  });

  return () => {
    unsubscribe();

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
};
