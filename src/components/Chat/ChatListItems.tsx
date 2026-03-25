import {
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Typography,
  Box,
  useTheme,
  Divider,
  Skeleton,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import FeedIcon from "@mui/icons-material/NewspaperRounded";
import { Link, useLocation } from "react-router-dom";
import type { Chat, Message } from "../../types";
import { useUserStore } from "../../stores/useUserStore";
import { resolveUser } from "../../utils/user";
import { getChatAvatarUrl, getChatTitle } from "../../utils/chat";
import UserAvatar from "../Ui/UserAvatar";

interface ChatListItemsProps {
  chats: Chat[];
  isLoading?: boolean;
  searchQuery?: string;
}

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
      if (url.match(/\.(jpg|jpeg|png|gif|webp)/)) filePrefix = "Фото";
      else if (url.match(/\.(mp4|mov|avi)/)) filePrefix = "Видео";
      else if (url.match(/\.(mp3|ogg|webm|m4a)/)) filePrefix = "Аудио";
      else filePrefix = "Файл";
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
        const interlocutor = resolveUser(chat.interlocutor, usersById);
        const name = (
          getChatTitle(chat, usersById, "Пользователь") ?? ""
        ).toLowerCase();
        const username = (interlocutor?.username || "").toLowerCase();
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

  return (
    <List sx={{ p: 0 }}>
      {filtered.map((chat, index) => {
        const isSelected = location.pathname.includes(chat.id);
        const lastMsg = chat.last_message;
        const isMine = lastMsg?.is_mine;

        return (
          <Box key={chat.id}>
            <ListItem disablePadding sx={{ p: 0 }}>
              <ListItemButton
                component={Link}
                to={`/chat/${chat.id}`}
                sx={{
                  borderRadius: "24px",
                  p: 1.5,
                  bgcolor: isSelected ? colors.fourth : "transparent",
                  transform: isSelected ? "translateX(4px)" : "translateX(0)",
                  boxShadow: isSelected ? "var(--surface-glow-soft)" : "none",
                  animation:
                    "softFadeUp var(--motion-base) var(--motion-spring)",
                  animationDelay: `${Math.min(index * 28, 180)}ms`,
                  animationFillMode: "both",
                  transition:
                    "background-color var(--motion-fast) var(--motion-soft), transform var(--motion-fast) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft)",
                  "&:hover": {
                    bgcolor: colors.third,
                    transform: "translateX(6px)",
                    boxShadow: "var(--surface-glow-soft)",
                  },
                  my: 1,
                }}
              >
                {chat.type === "direct" ? (
                  <UserAvatar
                    user={resolveUser(chat.interlocutor, usersById)}
                    sx={{ width: 50, height: 50, mr: 2 }}
                  />
                ) : (
                  <Avatar
                    src={getChatAvatarUrl(chat, usersById)}
                    sx={{ width: 50, height: 50, mr: 2 }}
                  />
                )}

                <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                  {chat.type !== "channel" ? (
                    <Typography
                      sx={{
                        color: colors.sixth,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      }}
                      noWrap
                    >
                      {getChatTitle(chat, usersById)}
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        color: colors.sixth,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                      noWrap
                    >
                      <FeedIcon
                        sx={{ fontSize: 16, color: colors.fiveth, mr: 0.5 }}
                      />
                      {getChatTitle(chat, usersById)}
                    </Typography>
                  )}

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
                          transition:
                            "color var(--motion-base) ease, transform var(--motion-fast) var(--motion-soft)",
                          transform: lastMsg.is_read
                            ? "scale(1.05)"
                            : "scale(1)",
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
                          boxShadow: lastMsg.is_read
                            ? "none"
                            : `0 0 0 6px ${colors.eighth}22`,
                          transition:
                            "all var(--motion-base) var(--motion-soft)",
                        }}
                      />
                    ))}
                </Box>
              </ListItemButton>
            </ListItem>
            <Divider
              orientation="horizontal"
              sx={{
                mx: "auto",
                opacity: 0.4,
                justifyContent: "center",
                width: "80%",
                bgcolor: colors.first,
              }}
            />
          </Box>
        );
      })}
    </List>
  );
};

export default ChatListItems;
