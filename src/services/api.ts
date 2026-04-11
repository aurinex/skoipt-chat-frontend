import { auth } from "./api/auth";
import { chats } from "./api/chats";
import { files } from "./api/files";
import { messages } from "./api/messages";
import { miniApps } from "./api/miniApps";
import { socket } from "./api/socket";
import { getMyId } from "./api/transport";
import { users } from "./api/users";

const api = { auth, chats, messages, files, users, miniApps };

export { getMyId, socket };
export type { SocketEventMap } from "./api/socket";
export default api;
