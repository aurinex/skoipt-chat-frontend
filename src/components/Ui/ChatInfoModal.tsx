import {
  Modal,
  Box,
  Typography,
  Avatar,
  Fade,
  Backdrop,
  Button,
  IconButton,
  ListItem,
  ListItemButton,
  CircularProgress,
  Chip,
  InputAdornment,
} from "@mui/material";
import type { ChatData, ChatPreview } from "../../types";
import type { AppColors } from "../../types/theme";
import { useChatMembersQuery } from "../../queries/useChatMembersQuery";
import { getMyId } from "../../services/api";
import api from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useUsersSearchQuery } from "../../queries/useUsersSearchQuery";
import type { User } from "../../types";
import { useCachedUser, useUserStore } from "../../stores/useUserStore";
import { getUserDisplayName, isChatAdmin, resolveUser } from "../../utils/user";
import { getChatAvatarUrl, getChatTitle } from "../../utils/chat";
import {
  canEditChatAvatar,
  canInviteMembers,
  canKickChatMember,
  canManageChat,
  canPromoteChatMember,
  canRevokeChatAdmin,
} from "../../utils/permissions";
import UserAvatar from "./UserAvatar";
import UserName from "./UserName";
import UserSubtitle from "./UserSubtitle";

import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import AppTextField from "./AppTextField";

interface Props {
  open: boolean;
  onClose: () => void;
  chatData: ChatData | ChatPreview | null;
  colors: AppColors;
}

const ChatInfoModal = ({ open, onClose, chatData, colors }: Props) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { data: users = [], isFetching } = useUsersSearchQuery(search);
  const usersById = useUserStore((state) => state.usersById);
  const interlocutor = useCachedUser(chatData?.interlocutor);

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const navigate = useNavigate();
  const type = chatData?.type ?? "direct";

  // 🔹 NAME
  let name = "";

  const chatId = chatData
    ? "id" in chatData
      ? chatData.id
      : (chatData.chat_id ?? null)
    : null;
  name = getChatTitle(chatData, usersById, "") ?? "";

  // 🔹 MEMBERS QUERY (только для group/channel)
  const { data, isLoading } = useChatMembersQuery(
    chatId ?? "",
    Boolean(open && chatId && (type === "group" || type === "channel")),
  );

  // 🔹 ADMIN CHECK
  const myId = getMyId();
  const canManageCurrentChat = canManageChat(chatData, myId, data?.members);
  const canEditAvatar = canEditChatAvatar(chatData, myId, data?.members);
  const canInviteToCurrentChat = canInviteMembers(
    chatData,
    myId,
    data?.members,
  );

  // 🔹 STATUS
  let status = "Информация";

  if (type === "group") {
    const count = data?.total ?? chatData.member_count ?? 0;
    status = `${count} участников`;
  }

  if (type === "channel") {
    const count = data?.total ?? chatData.member_count ?? 0;
    status = canManageCurrentChat
      ? `${count} участников`
      : `${count} подписчиков`;
  }

  useEffect(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;
    const startHeight = el.offsetHeight;
    setHeight(startHeight);

    requestAnimationFrame(() => {
      if (!contentRef.current) return;
      const endHeight = contentRef.current.scrollHeight;
      setHeight(endHeight);
    });
  }, [showAddInput, data?.members?.length]);

  if (!chatData) return null;

  const avatar = getChatAvatarUrl(chatData, usersById);

  const filteredUsers = users.filter(
    (u) => !(data?.members ?? []).some((m) => m.id === u.id),
  );
  const resolvedSelectedUsers = selectedUsers.map(
    (user) => resolveUser(user, usersById) ?? user,
  );
  const resolvedFilteredUsers = filteredUsers.map(
    (user) => resolveUser(user, usersById) ?? user,
  );
  const resolvedMembers =
    data?.members?.map((member) => resolveUser(member, usersById) ?? member) ??
    [];

  const handleAddMember = async () => {
    if (!chatId || selectedUsers.length === 0) return;

    try {
      await Promise.all(
        selectedUsers.map((user) => api.chats.addMember(chatId, user.id)),
      );

      setSelectedUsers([]);
      setSearch("");
      setShowAddInput(false);

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-details", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
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

  const handleMakeAdmin = async (userId: string) => {
    if (!chatId) return;

    try {
      await api.chats.makeAdmin(chatId, userId);

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });

      console.log("Пользователь повышен до администратора");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    if (!chatId) return;

    try {
      await api.chats.revokeAdmin(chatId, userId);

      queryClient.invalidateQueries({ queryKey: ["chat-members", chatId] });

      console.log("Администратор понижен до участника");
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
            width: 380,
            bgcolor: colors.second,
            borderRadius: "20px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,

            overflow: "hidden",
            height,
            transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* 🔹 AVATAR */}
          {type === "direct" ? (
            <UserAvatar
              user={interlocutor}
              sx={{
                width: 90,
                height: 90,
                cursor: canEditAvatar ? "pointer" : "default",
                "&:hover": canEditAvatar
                  ? {
                      opacity: 0.8,
                    }
                  : undefined,
              }}
              onClick={() => canEditAvatar && fileInputRef.current?.click()}
            />
          ) : (
            <Avatar
              src={avatar ?? undefined}
              sx={{
                width: 90,
                height: 90,
                cursor: canEditAvatar ? "pointer" : "default",
                "&:hover": canEditAvatar
                  ? {
                      opacity: 0.8,
                    }
                  : undefined,
              }}
              onClick={() => canEditAvatar && fileInputRef.current?.click()}
            />
          )}
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
              {canInviteToCurrentChat && (
                <Button
                  fullWidth
                  onClick={() => setShowAddInput((prev) => !prev)}
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
              {showAddInput && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {/* 🔍 INPUT */}
                  <AppTextField
                    value={search}
                    onChange={setSearch}
                    placeholder="Введите username"
                    autoFocus
                    styles={{
                      borderRadius: "12px",
                      ".MuiOutlinedInput-input ": {
                        padding: "19px 22px 19px 10px !important",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: "0px" }}>
                          <Typography sx={{ fontSize: 20 }}>@</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* 👤 SELECTED USER */}
                  {selectedUsers.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {resolvedSelectedUsers.map((user) => (
                        <Chip
                          key={user.id}
                          avatar={<UserAvatar user={user} />}
                          label={getUserDisplayName(user)}
                          onDelete={() =>
                            setSelectedUsers((prev) =>
                              prev.filter((x) => x.id !== user.id),
                            )
                          }
                          sx={{
                            bgcolor: colors.fourth,
                            color: colors.sixth,
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* 📜 RESULTS */}
                  <Box
                    sx={{
                      maxHeight: 500,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      // gap: 0.5,
                    }}
                  >
                    {isFetching && <CircularProgress size={20} />}

                    {/* {users.map((user: User) => (
                      <ListItem key={user.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleSelectUser(user)}
                          sx={{
                            borderRadius: "12px",
                            "&:hover": { bgcolor: colors.third },
                          }}
                        >
                          <Avatar
                            src={user.avatar_url ?? undefined}
                            sx={{ mr: 2 }}
                          />
                          <Box>
                            <Typography sx={{ color: colors.sixth }}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: colors.fiveth,
                              }}
                            >
                              @{user.username}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </Box> */}
                    {resolvedFilteredUsers.map((resolvedUser) => {
                      const isSelected = selectedUsers.some(
                        (u) => u.id === resolvedUser.id,
                      );

                      return (
                        <ListItem key={resolvedUser.id} disablePadding>
                          <ListItemButton
                            onClick={() =>
                              handleSelectUser(resolvedUser as User)
                            }
                            sx={{
                              borderRadius: "12px",
                              mb: "8px",
                              bgcolor: isSelected
                                ? colors.third
                                : "transparent",
                              "&:hover": { bgcolor: colors.third },
                            }}
                          >
                            <UserAvatar user={resolvedUser} sx={{ mr: 2 }} />
                            <Box>
                              <UserName
                                user={resolvedUser}
                                sx={{ color: colors.sixth }}
                              />
                              <UserSubtitle
                                user={resolvedUser}
                                sx={{
                                  fontSize: 12,
                                  color: colors.fiveth,
                                }}
                              />
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}

                    {/* ✅ APPLY BUTTON */}
                    <Button
                      disabled={selectedUsers.length === 0}
                      onClick={handleAddMember}
                      sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        bgcolor: colors.eighth,
                        color: "#fff",
                        "&:hover": { opacity: 0.9 },
                        "&.Mui-disabled": {
                          opacity: 0.4,
                          color: "#fff",
                        },
                      }}
                    >
                      Добавить ({selectedUsers.length})
                    </Button>
                  </Box>
                </Box>
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

                  {resolvedMembers.map((resolvedMember) => (
                    <Box
                      key={resolvedMember.id}
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
                        {/* {member.is_admin && (
                      <Typography sx={{ fontSize: 12, color: colors.fiveth }}>
                        а
                      </Typography>
                    )} */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            py: 0.5,
                          }}
                        >
                          {/* ⭐ STAR */}
                          <Box
                            sx={{
                              width: 18,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {/* c59300ff */}
                            {isChatAdmin(resolvedMember) ? (
                              <StarRoundedIcon
                                onClick={() =>
                                  handleRevokeAdmin(resolvedMember.id)
                                }
                                sx={{
                                  fontSize: 20,
                                  color: "#ffae00ff",
                                  transition: "color 0.2s ease",
                                  cursor: canRevokeChatAdmin(
                                    myId,
                                    resolvedMember,
                                    data?.members,
                                  )
                                    ? "pointer"
                                    : "default",
                                  ":hover": {
                                    color:
                                      resolvedMember.id === myId
                                        ? undefined
                                        : colors.seventh,
                                  },
                                }}
                              />
                            ) : canPromoteChatMember(
                                myId,
                                resolvedMember,
                                data?.members,
                              ) ? (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleMakeAdmin(resolvedMember.id)
                                }
                                sx={{
                                  p: 0.5,
                                  border: "none",
                                }}
                              >
                                <StarOutlineRoundedIcon
                                  sx={{
                                    fontSize: 20,
                                    color: colors.fiveth,
                                    transition: "color 0.2s ease",
                                    ":hover": {
                                      color: colors.wb,
                                    },
                                  }}
                                />
                              </IconButton>
                            ) : null}
                          </Box>

                          <UserAvatar
                            user={resolvedMember}
                            sx={{ width: 32, height: 32 }}
                          />

                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}
                          >
                            <UserName
                              user={resolvedMember}
                              sx={{
                                color: colors.sixth,
                                fontSize: 14,
                              }}
                            />

                            <UserSubtitle
                              user={resolvedMember}
                              sx={{
                                color: colors.fiveth,
                                fontSize: 12,
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {/* {member.is_admin && (
                      <Typography sx={{ fontSize: 12, color: colors.fiveth }}>
                        админ
                      </Typography>
                    )} */}

                        {/* 🔴 KICK BUTTON */}
                        {canKickChatMember(
                          myId,
                          resolvedMember,
                          data?.members,
                        ) && (
                          <Button
                            size="small"
                            onClick={() => handleKick(resolvedMember.id)}
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
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default ChatInfoModal;
