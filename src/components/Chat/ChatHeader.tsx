import { memo, useState } from "react";
import { Box, Typography, Avatar, IconButton, Skeleton } from "@mui/material";
import { getParticipantString } from "../../utils/chatFormatters";
import type { ChatData, ChatPreview, TypingUser } from "../../types";
import type { AppColors } from "../../types/theme";

import FindCustomIcon from "../../assets/icons/find.svg?react";
import SettingsCustomIcon from "../../assets/icons/settings.svg?react";
import ChatInfoModal from "../Ui/ChatInfoModal";
import { useCachedUser } from "../../stores/useUserStore";

interface ChatHeaderProps {
  chatData: ChatData | ChatPreview | null;
  typingUsers: TypingUser[];
  isMsgsLoading: boolean;
  colors: AppColors;
}

const getDisplayName = (chatData: ChatData | ChatPreview | null) => {
  if (!chatData) return null;
  if ("name" in chatData && chatData.name) return chatData.name;

  const interlocutor = chatData.interlocutor;
  if (!interlocutor) return null;

  if (interlocutor.full_name?.trim()) return interlocutor.full_name;

  const fullName = [interlocutor.first_name, interlocutor.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || interlocutor.username || null;
};

const ChatHeader = memo(
  ({ chatData, typingUsers, isMsgsLoading, colors }: ChatHeaderProps) => {
    const chatTitle = getDisplayName(chatData);
    const [openInfo, setOpenInfo] = useState(false);
    const interlocutor = useCachedUser(chatData?.interlocutor);

    const getStatusContent = () => {
      if (typingUsers.length > 0) {
        const hasNames = typingUsers.every((u) => u.first_name);
        if (!hasNames) {
          return typingUsers.length > 1
            ? "Несколько человек печатают..."
            : "Печатает...";
        }

        const names = typingUsers.map(
          (u) =>
            `${u.first_name}${u.last_name ? " " + u.last_name[0] + "." : ""}`,
        );

        if (names.length === 1) return `${names[0]} печатает...`;
        if (names.length === 2) return `${names[0]} и ${names[1]} печатают...`;
        return `${names[0]}, ${names[1]} и еще ${names.length - 2} печатают...`;
      }

      if (chatData) {
        if (chatData.interlocutor) {
          return chatData.interlocutor.is_online ? "В сети" : "был(а) недавно";
        }
        if ("member_count" in chatData && chatData.member_count !== undefined) {
          return getParticipantString(chatData.member_count);
        }
      }

      return "Загрузка данных...";
    };
    if (isMsgsLoading && !chatData) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: "14px 20px",
            bgcolor: colors.fourth, // Тот же фон, что у реального хедера
            borderRadius: "47px", // Тот же радиус
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Skeleton
              variant="circular"
              width={60}
              height={60}
              animation="wave"
              sx={{ bgcolor: colors.skeleton }}
            />
            <Box>
              <Skeleton
                variant="text"
                width={180}
                height={30}
                animation="wave"
                sx={{ bgcolor: colors.skeleton }}
              />
              <Skeleton
                variant="text"
                width={100}
                height={20}
                animation="wave"
                sx={{ bgcolor: colors.skeleton, mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Имитация кнопок поиска и настроек */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: colors.skeleton }}
            />
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: colors.skeleton }}
            />
          </Box>
        </Box>
      );
    }

    const getChatAvatar = (chatData: ChatData | ChatPreview | null) => {
      if (!chatData) return undefined;

      // direct чат
      if (chatData.type === "direct") {
        return interlocutor?.avatar_url ?? undefined;
      }

      // group / channel (только если это ChatData)
      if ("avatar_url" in chatData) {
        return chatData.avatar_url ?? undefined;
      }

      return undefined;
    };

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: "14px 20px",
          bgcolor: colors.fourth,
          borderRadius: "47px",
          mb: 2,
        }}
      >
        <Box
          onClick={() => setOpenInfo(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            borderRadius: "20px",
            px: 1,
            py: 0.5,
            transition: "background 0.2s",
          }}
        >
          <Avatar
            src={getChatAvatar(chatData)}
            sx={{ width: 60, height: 60 }}
          />
          {/* chatData?.interlocutor?.avatar_url */}
          <Box>
            <Typography
              sx={{ color: colors.sixth, fontWeight: 600, fontSize: 20 }}
            >
              {chatTitle || "Загрузка..."}
            </Typography>
            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 16,
                mt: "-6px",
              }}
            >
              {getStatusContent()}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton sx={{ color: colors.wb }}>
            <FindCustomIcon width={24} height={24} />
          </IconButton>
          <IconButton sx={{ color: colors.wb }}>
            <SettingsCustomIcon width={24} height={24} />
          </IconButton>
        </Box>
        <ChatInfoModal
          open={openInfo}
          onClose={() => setOpenInfo(false)}
          chatData={chatData}
          colors={colors}
        />
      </Box>
    );
  },
);

export default ChatHeader;
