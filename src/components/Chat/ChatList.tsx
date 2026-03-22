import { Box, Typography, useTheme, IconButton } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { socket } from "../../services/api";
import api from "../../services/api";
import newMessageIcon from "../../assets/icons/new_message.svg";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatSearch from "./ChatSearch";
import ChatListItems from "./ChatListItems";
import UserSearchResults from "./UserSearchResults";

interface ChatListProps {
  chats: any[];
  isLoading?: boolean;
}

const ChatList = ({ chats, isLoading }: ChatListProps) => {
  const [localChats, setLocalChats] = useState(chats);
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const theme = useTheme();
  const colors = theme.palette.background;
  const myIdRef = useRef(localStorage.getItem("user_id"));
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  // Поиск пользователей по беку при изменении query
  useEffect(() => {
    if (!isSearching) {
      setUserResults([]);
      return;
    }
    setUsersLoading(true);
    api.users
      .search(searchQuery)
      .then((res) => setUserResults(res))
      .catch(() => setUserResults([]))
      .finally(() => setUsersLoading(false));
  }, [searchQuery]);

  // WebSocket события
  useEffect(() => {
    const unsubTyping = socket.on("typing", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(data.chat_id)
            ? { ...chat, is_typing: data.is_typing }
            : chat,
        ),
      );
    });

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      setLocalChats((prev) => {
        const chatIndex = prev.findIndex(
          (c) => String(c.id) === String(msg.chat_id),
        );
        if (chatIndex === -1) return prev;
        const updatedChats = [...prev];
        const targetChat = {
          ...updatedChats[chatIndex],
          last_message: { ...msg, is_read: msg.is_mine ? true : false },
        };
        updatedChats.splice(chatIndex, 1);
        return [targetChat, ...updatedChats];
      });
    });

    const unsubRead = socket.on("read", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) => {
          if (String(chat.id) === String(data.chat_id) && chat.last_message) {
            if (data.message_ids.includes(chat.last_message.id)) {
              return {
                ...chat,
                last_message: { ...chat.last_message, is_read: true },
              };
            }
          }
          return chat;
        }),
      );
    });

    const unsubUnread = socket.on("unread_count", (data: any) => {
      if (data.unread_count === 0) {
        setLocalChats((prev) =>
          prev.map((chat) =>
            String(chat.id) === String(data.chat_id)
              ? {
                  ...chat,
                  last_message: chat.last_message
                    ? { ...chat.last_message, is_read: true }
                    : chat.last_message,
                }
              : chat,
          ),
        );
      }
    });

    const unsubNewChat = socket.on("new_chat", (data: any) => {
      const newChat = data.chat;
      setLocalChats((prev) => {
        if (prev.find((c) => String(c.id) === String(newChat.id))) return prev;
        return [newChat, ...prev];
      });
    });

    const unsubKicked = socket.on("kicked", (data: any) => {
      setLocalChats((prev) =>
        prev.filter((c) => String(c.id) !== String(data.chat_id)),
      );
    });

    const unsubLeft = socket.on("left_chat", (data: any) => {
      setLocalChats((prev) =>
        prev.filter((c) => String(c.id) !== String(data.chat_id)),
      );
    });

    return () => {
      unsubTyping();
      unsubMsg();
      unsubRead();
      unsubUnread();
      unsubNewChat();
      unsubKicked();
      unsubLeft();
    };
  }, []);

  return (
    <Box
      sx={{
        width: 321,
        bgcolor: colors.second,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: colors.sixth, fontSize: 36 }}
        >
          Мессенджер
        </Typography>
        <KeyboardArrowDownIcon />
        <IconButton sx={{ color: colors.fiveth }}>
          <img src={newMessageIcon} width={24} height={24} />
        </IconButton>
      </Box>

      <ChatSearch value={searchQuery} onChange={setSearchQuery} />

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {isSearching && (
          <>
            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 12,
                px: 1.5,
                mb: 0.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Чаты
            </Typography>
            <ChatListItems chats={localChats} searchQuery={searchQuery} />

            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 12,
                px: 1.5,
                mt: 2,
                mb: 0.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Люди
            </Typography>
            <UserSearchResults
              users={userResults}
              isLoading={usersLoading}
              query={searchQuery}
            />
          </>
        )}

        {!isSearching && (
          <ChatListItems chats={localChats} isLoading={isLoading} />
        )}
      </Box>
    </Box>
  );
};

export default ChatList;
