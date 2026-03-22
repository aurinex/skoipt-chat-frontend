export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  chats: {
    all: ["chats"] as const,
    preview: (userId: string) => ["chats", "preview", userId] as const,
  },
  users: {
    search: (query: string) => ["users", "search", query] as const,
  },
};
