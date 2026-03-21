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
import { useState, useEffect, useRef } from "react";
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

  // Ref чтобы сокет-колбэки всегда читали актуальный myId
  const myIdRef = useRef(localStorage.getItem("user_id"));

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
    const unsubTyping = socket.on("typing", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(data.chat_id)
            ? { ...chat, is_typing: data.is_typing }
            : chat,
        ),
      );
    });

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      setLocalChats((prev) => {
        const chatIndex = prev.findIndex(
          (c) => String(c.id) === String(msg.chat_id),
        );
        if (chatIndex === -1) return prev;

        const updatedChats = [...prev];
        const targetChat = { ...updatedChats[chatIndex], last_message: msg };
        updatedChats.splice(chatIndex, 1);
        return [targetChat, ...updatedChats];
      });
    });

    const unsubRead = socket.on("read", (data: any) => {
      setLocalChats((prev) =>
        prev.map((chat) => {
          if (String(chat.id) === String(data.chat_id) && chat.last_message) {
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
        // Читаем актуальный myId из ref — не из замыкания
        const currentMyId = myIdRef.current;
        setLocalChats((prev) =>
          prev.map((chat) =>
            String(chat.id) === String(data.chat_id)
              ? {
                  ...chat,
                  last_message: chat.last_message
                    ? {
                        ...chat.last_message,
                        read_by: [
                          ...(chat.last_message.read_by || []),
                          { user_id: currentMyId },
                        ],
                      }
                    : chat.last_message,
                }
              : chat,
          ),
        );
      }
    });

    const unsubNewChat = socket.on("new_chat", (data: any) => {
      const newChat = data.chat;
      setLocalChats((prev) => {
        // Не добавляем дубликат если чат уже есть
        if (prev.find((c) => String(c.id) === String(newChat.id))) return prev;
        return [newChat, ...prev];
      });
    });

    const unsubKicked = socket.on("kicked", (data: any) => {
      setLocalChats((prev) =>
        prev.filter((c) => String(c.id) !== String(data.chat_id)),
      );
    });

    const unsubLeft = socket.on("left_chat", (data: any) => {
      setLocalChats((prev) =>
        prev.filter((c) => String(c.id) !== String(data.chat_id)),
      );
    });

    return () => {
      unsubTyping();
      unsubMsg();
      unsubRead();
      unsubUnread();
      unsubNewChat();
      unsubKicked();
      unsubLeft();
    };
  }, []);

  const getLastMessagePreview = (msg: any, isMine: boolean) => {
    if (!msg) return "Нет сообщений";
    if (msg.is_system) return msg.text;

    // Собираем все файлы в один массив для удобства счета
    const files = msg.file_urls || (msg.file_url ? [msg.file_url] : []);
    const hasFiles = files.length > 0;
    const hasText = !!msg.text;

    // 1. Если нет ни файлов, ни текста
    if (!hasFiles && !hasText) return "Нет сообщений";

    // 2. Логика определения иконки или подписи для файлов
    let filePrefix = "";
    if (hasFiles) {
      if (files.length === 1) {
        const url = files[0].toLowerCase();
        if (url.match(/\.(jpg|jpeg|png|gif|webp)/)) filePrefix = "🖼 Фото";
        else if (url.match(/\.(mp4|mov|avi)/)) filePrefix = "🎥 Видео";
        else if (url.match(/\.(mp3|ogg|webm|m4a)/)) filePrefix = "🎵 Аудио";
        else filePrefix = "📎 Файл";
      } else {
        // Склонение слова "файл"
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

    // 3. Формируем итоговую строку
    if (hasFiles && hasText) {
      return `${msg.text} • ${filePrefix}`;
    } else if (hasFiles) {
      return filePrefix;
    } else {
      return msg.text; // Только текст
    }
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
            ? renderSkeletons()
            : localChats.map((chat) => {
                const isSelected = location.pathname.includes(chat.id);
                const lastMsg = chat.last_message;
                const isMine = lastMsg?.is_mine;
                const myId = myIdRef.current;

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
                              sx={{
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
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
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
