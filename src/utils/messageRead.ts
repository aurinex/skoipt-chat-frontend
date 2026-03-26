import type { Message } from "../types";

export const hasMessageBeenRead = (message?: Message | null) => {
  if (!message || message.is_system) return false;

  if (message.is_mine) {
    return Boolean(message.is_read) || (message.read_by?.length ?? 0) > 0;
  }

  return Boolean(message.is_read);
};
