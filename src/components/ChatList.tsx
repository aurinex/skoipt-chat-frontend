import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Typography,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Skeleton } from "@mui/material";
import { useState, useEffect } from "react";
import { socket } from "../services/api";

interface ChatListProps {
  chats: any[];
  isLoading?: boolean;
}

const ChatList = ({ chats, isLoading }: ChatListProps) => {
  const [localChats, setLocalChats] = useState(chats);
  const theme = useTheme();
  const location = useLocation();
  const colors = theme.palette.background;

  const myId = localStorage.getItem("user_id");

  const renderSkeletons = () => (
    <>
      {[...Array(7)].map((_, index) => (
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
    </>
  );

  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  useEffect(() => {
    // 1. Слушаем статус "Печатает" для списка
    const unsubTyping = socket.on("typing", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(data.chat_id)
            ? { ...chat, is_typing: data.is_typing }
            : chat,
        ),
      );
    });

    // 2. Слушаем новые сообщения, чтобы обновить текст и поднять чат вверх
    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      setLocalChats((prev) => {
        const chatIndex = prev.findIndex(
          (c) => String(c.id) === String(msg.chat_id),
        );
        if (chatIndex === -1) return prev;

        const updatedChats = [...prev];
        const targetChat = { ...updatedChats[chatIndex], last_message: msg };

        // Удаляем чат со старой позиции и ставим в начало списка
        updatedChats.splice(chatIndex, 1);
        return [targetChat, ...updatedChats];
      });
    });

    // 3. Слушаем события прочтения (для обновления галочек в списке)
    const unsubRead = socket.on("read", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) => {
          if (String(chat.id) === String(data.chat_id) && chat.last_message) {
            // Проверяем, входит ли последнее сообщение в список только что прочитанных
            if (data.message_ids.includes(chat.last_message.id)) {
              return {
                ...chat,
                last_message: {
                  ...chat.last_message,
                  read_by: [
                    ...(chat.last_message.read_by || []),
                    { user_id: data.user_id },
                  ],
                },
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
                    ? {
                        ...chat.last_message,
                        // Добавляем себя в read_by чтобы кружок побелел
                        read_by: [
                          ...(chat.last_message.read_by || []),
                          { user_id: myId },
                        ],
                      }
                    : chat.last_message,
                }
              : chat,
          ),
        );
      }
    });

    return () => {
      unsubTyping();
      unsubMsg();
      unsubRead();
      unsubUnread();
    };
  }, []);

  const getLastMessagePreview = (msg: any, isMine: boolean) => {
    if (!msg) return "Нет сообщений";
    if (msg.is_system) return msg.text;

    if (msg.text) return msg.text;

    if (msg.file_url) {
      const url = msg.file_url.toLowerCase();
      if (url.match(/\.(jpg|jpeg|png|gif|webp)/)) return "🖼 Фото";
      if (url.match(/\.(mp4|mov|avi)/)) return "🎥 Видео";
      if (url.match(/\.(mp3|ogg|webm|m4a)/)) return "🎵 Аудио";
      if (url.match(/\.pdf/)) return "📄 PDF";
      return "📎 Файл";
    }

    return "Нет сообщений";
  };

  return (
    <Box
      sx={{
        width: 321,
        bgcolor: colors.second,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          p: "60px 0px 20px 0px",
          fontWeight: 700,
          color: colors.sixth,
          fontSize: 36,
        }}
      >
        Мессенджер
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List sx={{ p: 0 }}>
          {isLoading
            ? renderSkeletons() // Показываем скелетоны при загрузке
            : localChats.map((chat) => {
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
                        src={chat.interlocutor?.avatar_url}
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
                          {chat.name ||
                            chat.interlocutor?.full_name ||
                            "Пользователь"}
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
                          {/* 1. Если сообщение наше, добавляем приписку "Вы:" */}
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
                            // Отображаем текст последнего сообщения
                            <Box
                              component="span"
                              sx={{
                                noWrap: true,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {getLastMessagePreview(lastMsg, isMine)}
                            </Box>
                          )}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          ml: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          minWidth: 24,
                        }}
                      >
                        {lastMsg && (
                          <>
                            {isMine ? (
                              /* --- ВАШЕ ПОСЛЕДНЕЕ СООБЩЕНИЕ (Галочки) --- */
                              <DoneAllIcon
                                sx={{
                                  fontSize: 18,

                                  color:
                                    lastMsg.read_by &&
                                    lastMsg.read_by.length > 0
                                      ? "#fff"
                                      : colors.eighth,
                                  transition: "color 0.3s ease",
                                }}
                              />
                            ) : (
                              /* --- СООБЩЕНИЕ СОБЕСЕДНИКА (Кружок) --- */
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  // Если вашего ID НЕТ в списке прочитавших — значит сообщение новое для вас
                                  bgcolor: lastMsg.read_by?.some(
                                    (r: any) =>
                                      String(r.user_id) === String(myId),
                                  )
                                    ? "#fff"
                                    : colors.eighth,
                                  transition: "all 0.3s ease",
                                }}
                              />
                            )}
                          </>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                );
              })}
        </List>
      </Box>
    </Box>
  );
};

export default ChatList;
