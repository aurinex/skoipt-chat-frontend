export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  chats: {
    all: ["chats"] as const,
    detail: (chatId: string) => ["chats", "detail", chatId] as const,
    preview: (userId: string) => ["chats", "preview", userId] as const,
  },
  messages: {
    list: (chatId: string) => ["messages", "list", chatId] as const,
  },
  users: {
    search: (query: string) => ["users", "search", query] as const,
  },
};
