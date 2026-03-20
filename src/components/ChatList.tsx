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

interface ChatListProps {
  chats: any[];
}

const ChatList = ({ chats }: ChatListProps) => {
  const theme = useTheme();
  const location = useLocation();
  const colors = theme.palette.background;

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
          {chats.map((chat) => {
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
                      {isMine && (
                        <Box
                          component="span"
                          sx={{ color: colors.fiveth, flexShrink: 0 }}
                        >
                          Вы:
                        </Box>
                      )}

                      {chat.is_typing ? (
                        <Box component="span" sx={{ color: colors.eighth }}>
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
                          {lastMsg?.text || "Нет сообщений"}
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
                      justifyContent: "center", // Центрируем индикаторы по вертикали
                      minWidth: 20,
                    }}
                  >
                    {/* 2. Логика индикаторов статуса */}
                    {lastMsg && (
                      <>
                        {isMine ? (
                          // Если отправили МЫ: галочки
                          <DoneAllIcon
                            sx={{
                              fontSize: 18,
                              // Синий если прочитано (eighth), серый если нет (fiveth)
                              color: lastMsg.is_read
                                ? colors.eighth
                                : colors.text,
                            }}
                          />
                        ) : (
                          // Если отправили НАМ: кружок
                          !lastMsg.is_read && (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                // Красный если не в диалоге (seventh), серый если в нем (fourth)
                                bgcolor: isSelected
                                  ? colors.third
                                  : colors.seventh,
                                borderRadius: "50%",
                                transition: "background-color 0.3s ease",
                              }}
                            />
                          )
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
