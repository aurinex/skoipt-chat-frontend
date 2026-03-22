import { memo } from "react";
import { Box, Typography, Avatar, IconButton, Skeleton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import { getParticipantString } from "../utils/chatFormatters";

import findIcon from "../assets/icons/find.svg";
import settingsIcon from "../assets/icons/settings.svg";

interface ChatHeaderProps {
  chatData: any;
  typingUsers: any[];
  isMsgsLoading: boolean;
  colors: any;
}

const ChatHeader = memo(
  ({ chatData, typingUsers, isMsgsLoading, colors }: ChatHeaderProps) => {
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
        if (chatData.member_count !== undefined) {
          return getParticipantString(chatData.member_count);
        }
      }

      return "Загрузка данных...";
    };

    const isTyping = typingUsers.length > 0;

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
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            src={chatData?.interlocutor?.avatar_url}
            sx={{ width: 60, height: 60 }}
          />
          {/* chatData?.interlocutor?.avatar_url */}
          <Box>
            <Typography
              sx={{ color: colors.sixth, fontWeight: 600, fontSize: 24 }}
            >
              {chatData?.name ||
                chatData?.interlocutor?.full_name ||
                "Загрузка..."}
            </Typography>
            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 18,
                mt: "-6px",
              }}
            >
              {getStatusContent()}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton sx={{ color: colors.wb }}>
            <img src={findIcon} width={24} height={24} />
          </IconButton>
          <IconButton sx={{ color: colors.wb }}>
            <img src={settingsIcon} width={24} height={24} />
          </IconButton>
        </Box>
      </Box>
    );
  },
);

export default ChatHeader;
