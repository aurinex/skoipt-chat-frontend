const DB_NAME = "skoipt-chat-cache";
const DB_VERSION = 1;
const STORE_NAME = "entries";

interface CacheEntry<T> {
  key: string;
  value: T;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = () => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
) => {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    handler(store).then(resolve).catch(reject);

    transaction.onerror = () => reject(transaction.error);
  });
};

export const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    return await withStore("readonly", (store) => {
      return new Promise<T | null>((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result as CacheEntry<T> | undefined;
          resolve(result?.value ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    });
  } catch {
    return null;
  }
};

export const idbSet = async <T>(key: string, value: T) => {
  try {
    await withStore("readwrite", (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({ key, value } satisfies CacheEntry<T>);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error) {
    console.warn("Не удалось сохранить данные в IndexedDB", error);
  }
};

export const idbDelete = async (key: string) => {
  try {
    await withStore("readwrite", (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error) {
    console.warn("Не удалось удалить данные из IndexedDB", error);
  }
};
