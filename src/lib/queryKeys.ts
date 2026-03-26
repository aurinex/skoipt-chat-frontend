export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  chats: {
    all: ["chats"] as const,
    lists: ["chats", "list"] as const,
    list: (type = "all") => ["chats", "list", type] as const,
    detail: (chatId: string) => ["chats", "detail", chatId] as const,
    preview: (userId: string) => ["chats", "preview", userId] as const,
  },
  messages: {
    list: (chatId: string) => ["messages", "list", chatId] as const,
  },
  users: {
    search: (query: string) => ["users", "search", query] as const,
  },
  directories: {
    specialties: ["directories", "specialties"] as const,
  },
};
