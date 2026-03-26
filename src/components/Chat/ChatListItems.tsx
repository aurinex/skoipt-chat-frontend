import { memo } from "react";
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import FeedIcon from "@mui/icons-material/NewspaperRounded";
import { Link, useLocation } from "react-router-dom";
import type { Chat, Message } from "../../types";
import type { AppColors } from "../../types/theme";
import { useUserStore } from "../../stores/useUserStore";
import { resolveUser } from "../../utils/user";
import { getChatAvatarUrl, getChatTitle } from "../../utils/chat";
import {
  inferMessageType,
  splitMessageAttachments,
} from "../../utils/messageAttachments";
import UserAvatar from "../Ui/UserAvatar";
import MessageReadIndicator from "./MessageReadIndicator";

interface ChatListItemsProps {
  chats: Chat[];
  isLoading?: boolean;
  searchQuery?: string;
}

interface ChatRowProps {
  chat: Chat;
  index: number;
  isSelected: boolean;
  colors: AppColors;
  usersById: ReturnType<typeof useUserStore.getState>["usersById"];
}

const getPluralizedFiles = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  let word = "файлов";

  if (lastTwoDigits < 11 || lastTwoDigits > 19) {
    if (lastDigit === 1) word = "файл";
    else if (lastDigit >= 2 && lastDigit <= 4) word = "файла";
  }

  return `${count} ${word}`;
};

const getLastMessagePreview = (msg?: Message | null) => {
  if (!msg) return "Нет сообщений";

  const messageType = inferMessageType(msg);
  if (messageType === "system") {
    return msg.text ?? "Системное сообщение";
  }

  const { attachments, imageAttachments, voiceAttachments } =
    splitMessageAttachments(msg);
  const hasAttachments = attachments.length > 0;
  const hasText = Boolean(msg.text);

  if (!hasAttachments && !hasText) return "Нет сообщений";

  let attachmentLabel = "";

  if (hasAttachments) {
    if (attachments.length === 1) {
      if (messageType === "image" || imageAttachments.length === 1) {
        attachmentLabel = "Фото";
      } else if (messageType === "voice" || voiceAttachments.length === 1) {
        attachmentLabel = "Голосовое";
      } else {
        attachmentLabel = "Файл";
      }
    } else {
      attachmentLabel = getPluralizedFiles(attachments.length);
    }
  }

  if (hasText && hasAttachments) return `${msg.text} • ${attachmentLabel}`;
  if (hasAttachments) return attachmentLabel;
  return msg.text ?? "Нет сообщений";
};

const ChatListRow = memo(
  ({ chat, index, isSelected, colors, usersById }: ChatRowProps) => {
    const lastMsg = chat.last_message;
    const isMine = lastMsg?.is_mine;
    const isSystemLastMessage = lastMsg
      ? inferMessageType(lastMsg) === "system"
      : false;
    const resolvedInterlocutor = resolveUser(chat.interlocutor, usersById);

    return (
      <Box
        sx={{
          contentVisibility: "auto",
          containIntrinsicSize: "78px",
        }}
      >
        <ListItem disablePadding sx={{ p: 0 }}>
          <ListItemButton
            component={Link}
            to={`/chat/${chat.id}`}
            sx={{
              borderRadius: "24px",
              p: 1.5,
              my: 1,
              bgcolor: isSelected ? colors.fourth : "transparent",
              transform: isSelected ? "translateX(4px)" : "translateX(0)",
              boxShadow: isSelected ? "var(--surface-glow-soft)" : "none",
              animation: "softFadeUp var(--motion-base) var(--motion-spring)",
              animationDelay: `${Math.min(index * 28, 180)}ms`,
              animationFillMode: "both",
              transition:
                "background-color var(--motion-fast) var(--motion-soft), transform var(--motion-fast) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft)",
              "&:hover": {
                bgcolor: colors.third,
                transform: "translateX(6px)",
                boxShadow: "var(--surface-glow-soft)",
              },
            }}
          >
            {chat.type === "direct" ? (
              <UserAvatar
                user={resolvedInterlocutor}
                sx={{ width: 50, height: 50, mr: 2 }}
              />
            ) : (
              <Avatar
                src={getChatAvatarUrl(chat, usersById)}
                sx={{ width: 50, height: 50, mr: 2 }}
              />
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
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
                {isMine && !isSystemLastMessage && (
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
              {lastMsg && (
                <MessageReadIndicator
                  message={lastMsg}
                  colors={colors}
                  variant="chat-list"
                />
              )}
            </Box>
          </ListItemButton>
        </ListItem>
        <Divider
          orientation="horizontal"
          sx={{
            mx: "auto",
            width: "80%",
            opacity: 0.4,
            justifyContent: "center",
            bgcolor: colors.first,
          }}
        />
      </Box>
    );
  },
);

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
        {Array.from({ length: 7 }).map((_, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1.5, p: 0 }}>
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
      {filtered.map((chat, index) => (
        <ChatListRow
          key={chat.id}
          chat={chat}
          index={index}
          isSelected={location.pathname.includes(chat.id)}
          colors={colors}
          usersById={usersById}
        />
      ))}
    </List>
  );
};

export default ChatListItems;
