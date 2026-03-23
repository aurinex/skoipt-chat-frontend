import { memo, useState } from "react";
import { Box, Typography, Avatar, IconButton, Skeleton } from "@mui/material";
import { getParticipantString } from "../../utils/chatFormatters";
import type { ChatData, ChatPreview, TypingUser } from "../../types";
import type { AppColors } from "../../types/theme";

import FindCustomIcon from "../../assets/icons/find.svg?react";
import SettingsCustomIcon from "../../assets/icons/settings.svg?react";
import ChatInfoModal from "../Ui/ChatInfoModal";
import { useCachedUser } from "../../stores/useUserStore";
import { getUserDisplayName } from "../../utils/user";
import UserAvatar from "../Ui/UserAvatar";
import UserStatus from "../Ui/UserStatus";

interface ChatHeaderProps {
  chatData: ChatData | ChatPreview | null;
  typingUsers: TypingUser[];
  isMsgsLoading: boolean;
  colors: AppColors;
}

const getDisplayName = (
  chatData: ChatData | ChatPreview | null,
  interlocutorName: string,
) => {
  if (!chatData) return null;
  if ("name" in chatData && chatData.name) return chatData.name;
  return interlocutorName || null;
};

const ChatHeader = memo(
  ({ chatData, typingUsers, isMsgsLoading, colors }: ChatHeaderProps) => {
    const [openInfo, setOpenInfo] = useState(false);
    const interlocutor = useCachedUser(chatData?.interlocutor);
    const interlocutorName = getUserDisplayName(interlocutor, "");
    const chatTitle = getDisplayName(chatData, interlocutorName);

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
          {chatData?.type === "direct" ? (
            <UserAvatar user={interlocutor} sx={{ width: 60, height: 60 }} />
          ) : (
            <Avatar
              src={chatData && "avatar_url" in chatData ? chatData.avatar_url ?? undefined : undefined}
              sx={{ width: 60, height: 60 }}
            />
          )}
          <Box>
            <Typography
              sx={{ color: colors.sixth, fontWeight: 600, fontSize: 20 }}
            >
              {chatTitle || "Загрузка..."}
            </Typography>
            {typingUsers.length > 0 ? (
              <UserStatus
                typingUsers={typingUsers}
                sx={{
                  color: colors.fiveth,
                  fontSize: 16,
                  mt: "-6px",
                }}
              />
            ) : chatData?.interlocutor ? (
              <UserStatus
                user={interlocutor}
                sx={{
                  color: colors.fiveth,
                  fontSize: 16,
                  mt: "-6px",
                }}
              />
            ) : (
              <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 16,
                mt: "-6px",
              }}
            >
              {chatData && "member_count" in chatData && chatData.member_count !== undefined ? (
                getParticipantString(chatData.member_count)
              ) : (
                "Загрузка данных..."
              )}
              </Typography>
            )}
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
