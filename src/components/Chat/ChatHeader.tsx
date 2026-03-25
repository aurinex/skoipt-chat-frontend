import { memo, useState } from "react";
import { Avatar, Box, IconButton, Skeleton, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { getParticipantString } from "../../utils/chatFormatters";
import type { ChatData, ChatPreview, TypingUser } from "../../types";
import type { AppColors } from "../../types/theme";

import FindCustomIcon from "../../assets/icons/find.svg?react";
import SettingsCustomIcon from "../../assets/icons/settings.svg?react";
import ChatInfoModal from "../Ui/ChatInfoModal";
import { useResolvedUser } from "../../stores/useUserStore";
import { getChatAvatarUrl, getChatTitle } from "../../utils/chat";
import UserAvatar from "../Ui/UserAvatar";
import UserStatus from "../Ui/UserStatus";
import { useUserStore } from "../../stores/useUserStore";
import { useResponsive } from "../../hooks/useResponsive";

interface ChatHeaderProps {
  chatData: ChatData | ChatPreview | null;
  typingUsers: TypingUser[];
  isMsgsLoading: boolean;
  colors: AppColors;
}

const ChatHeader = memo(
  ({ chatData, typingUsers, isMsgsLoading, colors }: ChatHeaderProps) => {
    const [openInfo, setOpenInfo] = useState(false);
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const usersById = useUserStore((state) => state.usersById);
    const interlocutor = useResolvedUser(chatData?.interlocutor);
    const chatTitle = getChatTitle(
      chatData,
      usersById,
      "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...",
    );
    const chatAvatarUrl = getChatAvatarUrl(chatData, usersById);

    if (isMsgsLoading && !chatData) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: isMobile ? "12px 14px" : "14px 20px",
            bgcolor: colors.fourth,
            borderRadius: "47px",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Skeleton
              variant="circular"
              width={isMobile ? 46 : 60}
              height={isMobile ? 46 : 60}
              animation="wave"
              sx={{ bgcolor: colors.skeleton }}
            />
            <Box>
              <Skeleton
                variant="text"
                width={isMobile ? 120 : 180}
                height={30}
                animation="wave"
                sx={{ bgcolor: colors.skeleton }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? 80 : 100}
                height={20}
                animation="wave"
                sx={{ bgcolor: colors.skeleton, mt: 0.5 }}
              />
            </Box>
          </Box>

          {!isMobile && (
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
          )}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: isMobile ? "12px 14px" : "14px 20px",
          bgcolor: colors.fourth,
          borderRadius: "47px",
          mb: 2,
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 1 : "12px",
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          {isMobile && (
            <IconButton
              sx={{
                color: colors.wb,
                gap: "10px",
                ":before": {
                  content: '""',
                  position: "absolute",
                  top: 13,
                  left: 5,
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  bgcolor: colors.seventh,
                },
              }}
              onClick={() => navigate("/")}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, zIndex: 1 }}>
                {chatData && "unread_count" in chatData
                  ? (chatData.unread_count ?? null)
                  : null}
              </Typography>

              <ArrowBackRoundedIcon />
            </IconButton>
          )}

          <Box
            onClick={() => setOpenInfo(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 1 : "12px",
              minWidth: 0,
              cursor: "pointer",
              borderRadius: "20px",
              px: isMobile ? 0 : 1,
              py: 0.5,
              transition:
                "background-color var(--motion-fast) var(--motion-soft), transform var(--motion-fast) var(--motion-soft)",
              "&:hover": {
                transform: "translateY(-1px)",
              },
            }}
          >
            {chatData?.type === "direct" ? (
              <UserAvatar
                user={interlocutor}
                sx={{ width: isMobile ? 46 : 60, height: isMobile ? 46 : 60 }}
              />
            ) : (
              <Avatar
                src={chatAvatarUrl}
                sx={{ width: isMobile ? 46 : 60, height: isMobile ? 46 : 60 }}
              />
            )}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: colors.sixth,
                  fontWeight: 600,
                  fontSize: isMobile ? 16 : 20,
                }}
                noWrap
              >
                {chatTitle ||
                  "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430..."}
              </Typography>

              {typingUsers.length > 0 ? (
                <UserStatus
                  typingUsers={typingUsers}
                  sx={{
                    color: colors.fiveth,
                    fontSize: isMobile ? 13 : 16,
                    mt: "-6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    "&::after": {
                      content: '""',
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: colors.eighth,
                      animation: "softPulse 1.4s ease-in-out infinite",
                    },
                  }}
                />
              ) : chatData?.interlocutor ? (
                <UserStatus
                  user={interlocutor}
                  sx={{
                    color: colors.fiveth,
                    fontSize: isMobile ? 13 : 16,
                    mt: "-6px",
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    color: colors.fiveth,
                    fontSize: isMobile ? 13 : 16,
                    mt: "-6px",
                  }}
                >
                  {chatData &&
                  "member_count" in chatData &&
                  chatData.member_count !== undefined
                    ? getParticipantString(chatData.member_count)
                    : "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u0430\u043d\u043d\u044b\u0445..."}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {!isMobile && (
          <Box>
            <IconButton sx={{ color: colors.wb }}>
              <FindCustomIcon width={24} height={24} />
            </IconButton>
            <IconButton sx={{ color: colors.wb }}>
              <SettingsCustomIcon width={24} height={24} />
            </IconButton>
          </Box>
        )}

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
