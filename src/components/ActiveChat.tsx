import { useEffect, useState, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Skeleton,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import api, { socket } from "../services/api";

interface ActiveChatProps {
  onMessageSent?: (msg: any) => void;
}

interface ContextType {
  handleUpdateChat: (msg: any) => void;
}

const ActiveChat = (props: ActiveChatProps) => {
  const { handleUpdateChat } = useOutletContext<ContextType>();
  const { onMessageSent } = props;

  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;

  const [messages, setMessages] = useState<any[]>([]);
  const [isMsgsLoading, setIsMsgsLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null); // Состояние для данных чата
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const typingTimersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const readTimerRef = useRef<NodeJS.Timeout | null>(null);

  const myId = localStorage.getItem("user_id");

  const sendReadEvent = (messageId: number | string) => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);

    readTimerRef.current = setTimeout(() => {
      console.log("[READ] Отправляю read:", chatId, messageId);
      // Используем готовый метод из api.ts вместо прямого обращения к _send
      socket.sendRead(chatId, messageId);
    }, 500);
  };

  // Авто-прочтение при открытии чата или новых сообщениях
  useEffect(() => {
    if (messages.length > 0) {
      const lastIncoming = [...messages]
        .reverse()
        .find((m) => String(m.sender_id) !== String(myId));
      if (lastIncoming) {
        sendReadEvent(lastIncoming.id);
      }
    }
  }, [messages.length, chatId]);

  // 1. Загрузка данных чата и сообщений
  useEffect(() => {
    if (chatId) {
      // Загружаем сообщения
      api.messages
        .list(chatId)
        .then(setMessages)
        .catch(() => {});

      // Загружаем инфо о чате (убедись, что в твоем api.ts есть метод get)
      api.chats
        .get(chatId)
        .then(setChatData)
        .catch((err) => console.error("Ошибка загрузки чата", err));
    }
  }, [chatId]);

  // 2. Слушаем сокеты (новые сообщения и статус печати)
  useEffect(() => {
    if (!chatId) return;

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      if (String(msg.chat_id) === String(chatId)) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Если сообщение пришло от другого человека — помечаем как прочитанное
        if (String(msg.sender_id) !== myId) {
          sendReadEvent(msg.id);
        }
      }
    });

    const unsubRead = socket.on("read", (data: any) => {
      // data обычно содержит: { chat_id, message_ids: [], user_id, read_at }
      if (String(data.chat_id) === String(chatId)) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (data.message_ids.includes(msg.id)) {
              // Проверяем, нет ли уже этого пользователя в списке прочитавших
              const alreadyRead = msg.read_by?.some(
                (r: any) => r.user_id === data.user_id,
              );
              if (alreadyRead) return msg;

              return {
                ...msg,
                read_by: [
                  ...(msg.read_by || []),
                  { user_id: data.user_id, read_at: data.read_at },
                ],
              };
            }
            return msg;
          }),
        );
      }
    });

    const unsubTyping = socket.on("typing", (data: any) => {
      if (String(data.chat_id) === String(chatId)) {
        const userId = data.user_id;

        if (data.is_typing) {
          // 1. Добавляем пользователя в список печатающих
          setTypingUsers((prev) =>
            prev.some((u) => u.user_id === userId) ? prev : [...prev, data],
          );

          // 2. Сбрасываем старый таймер для этого пользователя, если он был
          if (typingTimersRef.current[userId]) {
            clearTimeout(typingTimersRef.current[userId]);
          }

          // 3. Ставим новый таймер на 5 секунд
          typingTimersRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== userId));
            delete typingTimersRef.current[userId];
          }, 5000);
        } else {
          // Если пришло явное is_typing: false — удаляем сразу и чистим таймер
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== userId));
          if (typingTimersRef.current[userId]) {
            clearTimeout(typingTimersRef.current[userId]);
            delete typingTimersRef.current[userId];
          }
        }
      }
    });

    const unsubEdited = socket.on("message_edited", (data: any) => {
      if (String(data.chat_id) === String(chatId)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message_id
              ? {
                  ...m,
                  text: data.text,
                  is_edited: true,
                  edited_at: data.edited_at,
                }
              : m,
          ),
        );
      }
    });

    const unsubDeleted = socket.on("message_deleted", (data: any) => {
      if (String(data.chat_id) === String(chatId)) {
        setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
      }
    });

    const unsubChatUpdated = socket.on("chat_updated", (data: any) => {
      if (String(data.chat_id) === String(chatId)) {
        setChatData((prev: any) => ({
          ...prev,
          member_count: data.member_count,
          members: data.members,
          admins: data.admins,
        }));
      }
    });

    return () => {
      unsubMsg();
      unsubRead();
      unsubTyping();
      unsubEdited();
      unsubDeleted();
      unsubChatUpdated();
      Object.values(typingTimersRef.current).forEach(clearTimeout);
    };
  }, [chatId]);

  const getStatusContent = () => {
    // 1. Сначала проверяем, печатает ли кто-то
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

    // 2. Если никто не печатает, работаем с количеством участников
    if (chatData) {
      // Если это личный чат (есть собеседник)
      if (chatData.interlocutor) {
        return chatData.interlocutor.is_online ? "В сети" : "был(а) недавно";
      }

      // Если это группа (есть member_count)
      if (chatData.member_count !== undefined) {
        return getParticipantString(chatData.member_count);
      }
    }

    return "Загрузка данных...";
  };

  // Автоскролл вниз
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;
    try {
      const msg = await api.messages.send(chatId, { text: inputText });

      setMessages((prev) => [...prev, msg]);

      handleUpdateChat(msg);

      setInputText("");
      socket.sendTyping(chatId, false);
    } catch (err) {
      console.error("Ошибка отправки:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!chatId) return;

    // Если мы только начали печатать (таймера нет), отправляем true
    if (!myTypingTimerRef.current) {
      socket.sendTyping(chatId, true);
    }

    // Очищаем старый таймер паузы
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
    }

    // Ставим новый таймер: если через 2 секунды ничего не нажато — отправляем false
    myTypingTimerRef.current = setTimeout(() => {
      socket.sendTyping(chatId, false);
      myTypingTimerRef.current = null;
    }, 2000);
  };

  if (!chatId) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: colors.third,
        }}
      >
        <Typography sx={{ color: colors.fiveth }}>
          Выберите чат, чтобы начать общение
        </Typography>
      </Box>
    );
  }

  const renderHeaderSkeleton = () => (
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
          width={150}
          height={30}
          animation="wave"
          sx={{ bgcolor: colors.skeleton }}
        />
        <Skeleton
          variant="text"
          width={80}
          height={20}
          animation="wave"
          sx={{ bgcolor: colors.skeleton }}
        />
      </Box>
    </Box>
  );

  const renderMessageSkeletons = () => {
    const MAX_HEIGHT = 1000;
    const GAP = 16; // gap: 2 в MUI это 16px

    // Определяем возможные конфигурации высот для типов
    const types = [
      { name: "text", height: 45 },
      { name: "long-text", height: 90 },
      { name: "image", height: 210 }, // 150 (фото) + подпись + падинги
    ];

    let currentTotalHeight = 0;
    const skeletonsToRender = [];

    // Цикл подбора: добавляем, пока влезаем в 1000px
    while (currentTotalHeight < MAX_HEIGHT - 100) {
      // -100 небольшой запас снизу
      const randomType = types[Math.floor(Math.random() * types.length)];

      // Проверяем, не вылезем ли мы за лимит после добавления
      if (currentTotalHeight + randomType.height + GAP > MAX_HEIGHT) break;

      skeletonsToRender.push(randomType);
      currentTotalHeight += randomType.height + GAP;
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${GAP}px`,
          height: MAX_HEIGHT, // Фиксируем высоту контейнера
          overflow: "hidden", // Гарантируем отсутствие скролла
          pt: 2,
        }}
      >
        {skeletonsToRender.map((type, i) => {
          const isMe = i % 2 === 0;

          return (
            <Box
              key={i}
              sx={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                width: "45%",
              }}
            >
              {type.name === "image" ? (
                <Box
                  sx={{
                    p: 1,
                    bgcolor: colors.skeleton,
                    borderRadius: isMe
                      ? "20px 20px 5px 20px"
                      : "20px 20px 20px 5px",
                    width: "100%",
                    height: 190, // Фиксированная высота для предсказуемости расчета
                    opacity: 0.6,
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    animation="wave"
                    height={140}
                    sx={{ bgcolor: colors.third, borderRadius: "15px", mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width="70%"
                    sx={{ bgcolor: colors.third }}
                  />
                </Box>
              ) : (
                <Skeleton
                  variant="rounded"
                  animation="wave"
                  height={type.height}
                  sx={{
                    bgcolor: colors.skeleton,
                    borderRadius: isMe
                      ? "20px 20px 5px 20px"
                      : "20px 20px 20px 5px",
                    width: type.name === "text" ? "70%" : "100%",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        p: 2,
        bgcolor: colors.third,
      }}
    >
      {/* Header чата */}
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
        {isMsgsLoading && !chatData ? (
          renderHeaderSkeleton()
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar sx={{ width: 60, height: 60 }} />
            {/* <Avatar 
              src={chatData?.interlocutor?.avatar_url || ""} 
              sx={{ width: 60, height: 60 }} 
            /> */}
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
                  color: isTyping ? colors.eighth : colors.fiveth,
                  fontSize: 18,
                  mt: "-6px",
                }}
              >
                {getStatusContent()}
              </Typography>
            </Box>
          </Box>
        )}
        <Box>
          <IconButton sx={{ color: colors.wb }}>
            <SearchIcon />
          </IconButton>
          <IconButton sx={{ color: colors.wb }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Закрепленное сообщение (закомментировано) */}
      {/* 
      <Box sx={{ p: 2, bgcolor: colors.third, borderRadius: '15px', mb: 2, borderLeft: `4px solid ${colors.eighth}` }}>
        <Typography sx={{ color: colors.eighth, fontSize: '0.8rem', fontWeight: 700 }}>Закрепленное сообщение</Typography>
        <Typography sx={{ color: colors.fiveth, fontSize: '0.9rem' }}>Брат, я вчера влюбился....</Typography>
      </Box> 
      */}

      {/* Список сообщений */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {isMsgsLoading && messages.length === 0
          ? renderMessageSkeletons()
          : messages.map((msg, index) => {
              if (msg.is_system) {
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: "center",
                      my: 1,
                      px: 2,
                      py: 0.5,
                      bgcolor: colors.fourth,
                      borderRadius: "20px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: colors.fiveth,
                        fontSize: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      {msg.text}
                    </Typography>
                  </Box>
                );
              }
              const isMessageFromMe = msg.is_mine;

              const prevMsg = messages[index - 1];
              const isFirstInGroup =
                !prevMsg || prevMsg.sender_id !== msg.sender_id;
              const nextMsg = messages[index + 1];
              const isLastInGroup =
                !nextMsg || nextMsg.sender_id !== msg.sender_id;

              // --- ЛОГИКА ДАТЫ ---
              const currentDate = new Date(msg.created_at).toDateString();
              const prevDate = prevMsg
                ? new Date(prevMsg.created_at).toDateString()
                : null;
              const showDateLabel = currentDate !== prevDate;

              return (
                <Box key={msg.id} sx={{ display: "contents" }}>
                  {showDateLabel && (
                    <Box sx={{ alignSelf: "center", my: 2 }}>
                      <Typography
                        sx={{
                          color: colors.sixth,
                          fontSize: "14px",
                          p: "6px 25px",
                          borderRadius: "19px",
                          bgcolor: colors.second, // Упростил для чистоты, можешь вернуть свой градиент
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {formatDateLabel(msg.created_at)}
                      </Typography>
                    </Box>
                  )}

                  {/* ГЛАВНЫЙ КОНТЕЙНЕР СТРОКИ */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-end", // Аватар будет внизу сообщения
                      justifyContent: isMessageFromMe
                        ? "flex-end"
                        : "flex-start",
                      gap: 1,
                      mb: isLastInGroup ? 2 : 0.4,
                      mt: showDateLabel && !isFirstInGroup ? 1 : 0,
                    }}
                  >
                    {/* АВАТАР СЛЕВА (только для чужих) */}
                    {!isMessageFromMe && (
                      <Box
                        sx={{
                          width: 45,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        {isLastInGroup ? (
                          <Avatar
                            src={msg.sender?.avatar_url}
                            sx={{
                              width: 45,
                              height: 45,
                              fontSize: "1.2rem",
                              bgcolor: colors.eighth,
                            }}
                          >
                            {msg.sender?.first_name?.[0]}
                          </Avatar>
                        ) : (
                          <Box sx={{ width: 34 }} />
                        )}
                      </Box>
                    )}

                    {/* ПУЗЫРЬ И ИМЯ */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMessageFromMe ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                      }}
                    >
                      {/* Имя над первым сообщением в группе */}
                      {!isMessageFromMe &&
                        chatData?.member_count > 2 &&
                        isFirstInGroup && (
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: colors.eighth,
                              fontWeight: 600,
                              mb: 0.3,
                              ml: 1.5,
                            }}
                          >
                            {msg.sender?.first_name}{" "}
                            {msg.sender?.last_name?.[0]
                              ? `${msg.sender.last_name[0]}.`
                              : ""}
                          </Typography>
                        )}

                      {/* Само облачко */}
                      <Box
                        sx={{
                          p: "8px 14px",
                          borderRadius: isMessageFromMe
                            ? isLastInGroup
                              ? "18px 18px 4px 18px"
                              : "18px"
                            : isLastInGroup
                              ? "18px 18px 18px 4px"
                              : "18px",
                          bgcolor: isMessageFromMe
                            ? colors.eighth
                            : colors.second,
                          color: isMessageFromMe ? "#fff" : colors.sixth,
                          boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
                          position: "relative",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 0.5,
                            mt: 0.2,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.7rem", opacity: 0.5 }}>
                            {formatLocalTime(msg.created_at)}
                          </Typography>
                          {isMessageFromMe && (
                            <DoneAllIcon
                              sx={{
                                fontSize: 14,
                                color:
                                  msg.read_by?.length > 0
                                    ? "rgba(255, 255, 255, 1)"
                                    : "rgba(255, 255, 255, 0.5)",
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
      </Box>

      {/* Поле ввода */}
      <Box
        sx={{
          mt: 2,
          p: 1,
          bgcolor: colors.fourth,
          borderRadius: "25px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton sx={{ color: colors.fiveth }}>
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          placeholder="Сообщение"
          variant="standard"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
              // Сразу сбрасываем статус при отправке
              if (myTypingTimerRef.current) {
                clearTimeout(myTypingTimerRef.current);
                myTypingTimerRef.current = null;
              }
            }
          }}
          InputProps={{
            disableUnderline: true,
            sx: { color: colors.sixth, px: 1 },
          }}
        />
        <IconButton sx={{ color: colors.fiveth }}>
          <MicIcon />
        </IconButton>
        <IconButton sx={{ color: colors.eighth }} onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

const formatLocalTime = (dateStr: string) => {
  // Если в строке нет Z или +, добавляем Z, чтобы JS понял, что это UTC
  const isoStr =
    dateStr.includes("Z") || dateStr.includes("+")
      ? dateStr
      : `${dateStr.replace(" ", "T")}Z`;

  const date = new Date(isoStr);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDateLabel = (dateStr: string) => {
  // Повторяем логику с приведением к UTC
  const isoStr =
    dateStr.includes("Z") || dateStr.includes("+")
      ? dateStr
      : `${dateStr.replace(" ", "T")}Z`;

  const date = new Date(isoStr);
  const now = new Date();

  // Сравнение должно быть по локальным датам
  if (date.toDateString() === now.toDateString()) {
    return "Сегодня";
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const getParticipantString = (count: number) => {
  const remainder10 = count % 10;
  const remainder100 = count % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${count} участник`;
  }
  if (
    remainder10 >= 2 &&
    remainder10 <= 4 &&
    (remainder100 < 10 || remainder100 >= 20)
  ) {
    return `${count} участника`;
  }
  return `${count} участников`;
};

export default ActiveChat;
