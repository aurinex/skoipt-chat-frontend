import {
  Modal,
  Box,
  Typography,
  Avatar,
  Fade,
  Backdrop,
  Button,
} from "@mui/material";
import type { ChatData, ChatPreview } from "../../types";
import type { AppColors } from "../../types/theme";
import { useChatMembersQuery } from "../../queries/useChatMembersQuery";
import { getMyId } from "../../services/api";
import api from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  chatData: ChatData | ChatPreview | null;
  colors: AppColors;
}

const ChatInfoModal = ({ open, onClose, chatData, colors }: Props) => {
  if (!chatData) return null;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  const type = chatData.type;

  // 🔹 NAME
  let name = "";

  const chatId = "id" in chatData ? chatData.id : chatData.chat_id ?? null;

  if (type === "direct") {
    name = chatData.interlocutor
      ? `${chatData.interlocutor.first_name ?? ""} ${
          chatData.interlocutor.last_name ?? ""
        }`.trim()
      : "";
  } else {
    name = chatData.name ?? "";
  }

  // 🔹 MEMBERS QUERY (только для group/channel)
  const { data, isLoading } = useChatMembersQuery(
    chatId ?? "",
    Boolean(open && chatId && (type === "group" || type === "channel"))
  );

  // 🔹 ADMIN CHECK
  const myId = getMyId();
  const isAdmin =
    data?.members?.some((m) => m.id === myId && m.is_admin) ?? false;

  // 🔹 STATUS
  let status = "Информация";

  if (type === "group") {
    const count = data?.total ?? chatData.member_count ?? 0;
    status = `${count} участников`;
  }

  if (type === "channel") {
    const count = data?.total ?? chatData.member_count ?? 0;
    status = isAdmin ? `${count} участников` : `${count} подписчиков`;
  }

  // 🔹 AVATAR
  const avatar =
    type === "direct"
      ? chatData.interlocutor?.avatar_url
      : "avatar_url" in chatData
      ? chatData.avatar_url
      : undefined;

  const handleAddMember = async () => {
    if (!chatId) return;

    const userId = prompt("Введите ID пользователя");
    if (!userId) return;

    try {
      await api.chats.addMember(chatId, userId);
      console.log("Участник добавлен");

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async () => {
    if (!chatId) return;

    const userId = prompt("Введите ID пользователя");
    if (!userId) return;

    try {
      await api.chats.addMember(chatId, userId);

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      console.log("Приглашён");
    } catch (e) {
      console.error(e);
    }
  };

  const handleKick = async (userId: string) => {
    if (!chatId) return;

    try {
      await api.chats.kickMember(chatId, userId);

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      console.log("Пользователь выгнан");
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeave = async () => {
    if (!chatId) return;

    try {
      await api.chats.leave(chatId);
      console.log("Вы вышли из чата");

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      onClose(); // закрываем модалку
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!chatId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await api.files.uploadChatAvatar(chatId, file);

      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      console.log("Аватар обновлён");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200 } }}
      disableAutoFocus
      disableEnforceFocus
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 360,
            bgcolor: colors.second,
            borderRadius: "20px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* 🔹 AVATAR */}
          <Avatar
            src={avatar ?? undefined}
            sx={{
              width: 90,
              height: 90,
              cursor: isAdmin ? "pointer" : "default",
              "&:hover": isAdmin
                ? {
                    opacity: 0.8,
                  }
                : undefined,
            }}
            onClick={() => isAdmin && fileInputRef.current?.click()}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleUploadAvatar}
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* 🔹 NAME */}
            <Typography
              sx={{ color: colors.sixth, fontSize: 20, fontWeight: 600 }}
            >
              {name || "Без названия"}
            </Typography>

            {/* 🔹 Количество участников */}
            <Typography sx={{ color: colors.fiveth }}>{status}</Typography>
          </Box>

          {/* 🔹 DIRECT ACTION */}
          {type === "direct" && (
            <Button
              fullWidth
              sx={{
                mt: 1,
                borderRadius: "12px",
                textTransform: "none",
                bgcolor: colors.third,
                color: colors.sixth,
              }}
            >
              Открыть профиль
            </Button>
          )}

          {/* 🔹 ACTION BUTTONS */}
          {(type === "group" || type === "channel") && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                mt: 1,
              }}
            >
              {isAdmin && (
                <Button
                  fullWidth
                  onClick={type === "group" ? handleAddMember : handleInvite}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    bgcolor: colors.third,
                    color: colors.sixth,
                  }}
                >
                  {type === "group" ? "Добавить участника" : "Пригласить"}
                </Button>
              )}

              <Button
                fullWidth
                onClick={handleLeave}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  bgcolor: colors.third,
                  color: colors.sixth,
                }}
              >
                Выйти
              </Button>
            </Box>
          )}

          {/* 🔹 MEMBERS LIST */}
          {(type === "group" || type === "channel") && (
            <Box
              sx={{
                width: "100%",
                maxHeight: 220,
                overflowY: "auto",
                px: 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {isLoading && (
                <Typography sx={{ color: colors.fiveth, fontSize: 14 }}>
                  Загрузка участников...
                </Typography>
              )}

              {!isLoading && data?.members?.length === 0 && (
                <Typography sx={{ color: colors.fiveth, fontSize: 14 }}>
                  Нет участников
                </Typography>
              )}

              {data?.members?.map((member) => (
                <Box
                  key={member.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 0.5,
                    }}
                  >
                    <Avatar
                      src={member.avatar_url ?? undefined}
                      sx={{ width: 32, height: 32 }}
                    />

                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        sx={{
                          color: colors.sixth,
                          fontSize: 14,
                        }}
                      >
                        {member.first_name} {member.last_name}
                      </Typography>

                      <Typography
                        sx={{
                          color: colors.fiveth,
                          fontSize: 12,
                        }}
                      >
                        @{member.username}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {member.is_admin && (
                      <Typography sx={{ fontSize: 12, color: colors.fiveth }}>
                        админ
                      </Typography>
                    )}

                    {/* 🔴 KICK BUTTON */}
                    {isAdmin && member.id !== myId && (
                      <Button
                        size="small"
                        onClick={() => handleKick(member.id)}
                        sx={{
                          minWidth: "unset",
                          px: 1,
                          py: 0.5,
                          fontSize: 12,
                          color: "#ff4d4f",
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default ChatInfoModal;
