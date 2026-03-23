import {
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Skeleton } from "@mui/material";
import type { Chat, Message } from "../../types";
import { useUserStore } from "../../stores/useUserStore";

interface ChatListItemsProps {
  chats: Chat[];
  isLoading?: boolean;
  searchQuery?: string;
}

const getChatDisplayName = (chat: Chat) => {
  if (chat.name) return chat.name;
  if (chat.interlocutor?.full_name?.trim()) return chat.interlocutor.full_name;

  const fullName = [chat.interlocutor?.first_name, chat.interlocutor?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || chat.interlocutor?.username || "Пользователь";
};

const getLastMessagePreview = (msg?: Message | null) => {
  if (!msg) return "Нет сообщений";
  if (msg.is_system) return msg.text ?? "Системное сообщение";

  const files = msg.file_urls || (msg.file_url ? [msg.file_url] : []);
  const hasFiles = files.length > 0;
  const hasText = !!msg.text;

  if (!hasFiles && !hasText) return "Нет сообщений";

  let filePrefix = "";
  if (hasFiles) {
    if (files.length === 1) {
      const url = files[0].toLowerCase();
      if (url.match(/\.(jpg|jpeg|png|gif|webp)/)) filePrefix = "🖼 Фото";
      else if (url.match(/\.(mp4|mov|avi)/)) filePrefix = "🎥 Видео";
      else if (url.match(/\.(mp3|ogg|webm|m4a)/)) filePrefix = "🎵 Аудио";
      else filePrefix = "📎 Файл";
    } else {
      const count = files.length;
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      let word = "файлов";
      if (lastTwoDigits < 11 || lastTwoDigits > 19) {
        if (lastDigit === 1) word = "файл";
        else if (lastDigit >= 2 && lastDigit <= 4) word = "файла";
      }
      filePrefix = `${count} ${word}`;
    }
  }

  if (hasFiles && hasText) return `${msg.text} • ${filePrefix}`;
  if (hasFiles) return filePrefix;
  return msg.text;
};

const ChatListItems = ({
  chats,
  isLoading,
  searchQuery = "",
}: ChatListItemsProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const location = useLocation();
  const usersById = useUserStore((state) => state.usersById);

  const filtered = searchQuery.trim()
    ? chats.filter((chat) => {
        const q = searchQuery.toLowerCase();
        const name = getChatDisplayName(chat).toLowerCase();
        const username = (chat.interlocutor?.username || "").toLowerCase();
        return name.includes(q) || username.includes(q);
      })
    : chats;

  if (isLoading) {
    return (
      <List sx={{ p: 0 }}>
        {[...Array(7)].map((_, i) => (
          <ListItem key={i} disablePadding sx={{ mb: 1.5, p: 0 }}>
            <Box
              sx={{
                display: "flex",
                p: 1.5,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Skeleton
                variant="circular"
                animation="wave"
                width={50}
                height={50}
                sx={{ mr: 2, bgcolor: colors.skeleton }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton
                  variant="text"
                  animation="wave"
                  width="60%"
                  height={20}
                  sx={{ mb: 1, bgcolor: colors.skeleton }}
                />
                <Skeleton
                  variant="text"
                  animation="wave"
                  width="90%"
                  height={15}
                  sx={{ bgcolor: colors.skeleton }}
                />
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    );
  }

  if (!filtered.length && searchQuery.trim()) {
    return (
      <Typography sx={{ color: colors.fiveth, fontSize: 14, px: 1.5, mt: 1 }}>
        Чатов не найдено
      </Typography>
    );
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === "direct") {
      return usersById[chat.interlocutor?.id ?? ""]?.avatar_url ?? chat.interlocutor?.avatar_url ?? undefined;
    }

    return chat.avatar_url ?? undefined;
  };

  return (
    <List sx={{ p: 0 }}>
      {filtered.map((chat) => {
        const isSelected = location.pathname.includes(chat.id);
        const lastMsg = chat.last_message;
        const isMine = lastMsg?.is_mine;

        return (
          <ListItem key={chat.id} disablePadding sx={{ mb: 0.5, p: 0 }}>
            <ListItemButton
              component={Link}
              to={`/chat/${chat.id}`}
              sx={{
                borderRadius: "24px",
                p: 1.5,
                bgcolor: isSelected ? colors.fourth : "transparent",
                "&:hover": { bgcolor: colors.third },
                transition: "background-color 0.2s",
              }}
            >
              <Avatar
                src={getChatAvatar(chat)}
                sx={{ width: 50, height: 50, mr: 2 }}
              />

              <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                <Typography
                  sx={{
                    color: colors.sixth,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                  }}
                  noWrap
                >
                  {getChatDisplayName(chat)}
                </Typography>

                <Typography
                  sx={{
                    color: isSelected ? colors.sixth : colors.fiveth,
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                  noWrap
                >
                  {isMine && !lastMsg?.is_system && (
                    <Box
                      component="span"
                      sx={{ color: colors.fiveth, flexShrink: 0 }}
                    >
                      Вы:
                    </Box>
                  )}
                  {chat.is_typing ? (
                    <Box component="span" sx={{ color: colors.fiveth }}>
                      Печатает...
                    </Box>
                  ) : (
                    <Box
                      component="span"
                      sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {getLastMessagePreview(lastMsg)}
                    </Box>
                  )}
                </Typography>
              </Box>

              <Box
                sx={{
                  ml: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  minWidth: 24,
                }}
              >
                {lastMsg &&
                  (isMine ? (
                    <DoneAllIcon
                      sx={{
                        mr: "12px",
                        fontSize: 18,
                        color: lastMsg.is_read ? "#fff" : colors.eighth,
                        transition: "color 0.3s ease",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        mr: "17px",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: lastMsg.is_read ? "#fff" : colors.eighth,
                        transition: "all 0.3s ease",
                      }}
                    />
                  ))}
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatListItems;
