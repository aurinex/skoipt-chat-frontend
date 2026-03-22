import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import api, { socket } from "../services/api";

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) api.messages.list(chatId).then(setMessages);

    const unsubMsg = socket.on("new_message", (data: any) => {
      const msg = data.message || data;
      if (String(msg.chat_id) === String(chatId)) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      }
    });

    const unsubTyping = socket.on("typing", (data: any) => {
      if (String(data.chat_id) === String(chatId)) setIsTyping(data.is_typing);
    });

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const msg = await api.messages.send(chatId!, { text: inputText });
    setMessages((prev) => [...prev, msg]);
    setInputText("");
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100vh", p: 2 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: "10px 20px",
          bgcolor: colors.third,
          borderRadius: "25px",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ width: 45, height: 45 }} />
          <Box>
            <Typography sx={{ color: colors.sixth, fontWeight: 600 }}>
              Дима Ситников
            </Typography>
            <Typography
              sx={{
                color: isTyping ? colors.eighth : colors.fiveth,
                fontSize: "0.8rem",
              }}
            >
              {isTyping ? "Печатает..." : "В сети"}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton sx={{ color: colors.fiveth }}>
            <SearchIcon />
          </IconButton>
          <IconButton sx={{ color: colors.fiveth }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Закрепленное сообщение (закомментировано)
      <Box sx={{ p: 2, bgcolor: colors.third, borderRadius: '15px', mb: 2, borderLeft: `4px solid ${colors.eighth}` }}>
        <Typography sx={{ color: colors.eighth, fontSize: '0.8rem', fontWeight: 700 }}>Закрепленное сообщение</Typography>
        <Typography sx={{ color: colors.fiveth, fontSize: '0.9rem' }}>Брат, я вчера влюбился....</Typography>
      </Box> 
      */}

      {/* Диалог */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            alignSelf: "center",
            my: 2,
            px: 2,
            py: 0.5,
            bgcolor: colors.third,
            borderRadius: "20px",
          }}
        >
          <Typography sx={{ color: colors.sixth, fontSize: "0.8rem" }}>
            20 марта
          </Typography>
        </Box>

        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              alignSelf: msg.is_mine ? "flex-end" : "flex-start",
              maxWidth: "70%",
            }}
          >
            <Box
              sx={{
                p: "10px 16px",
                borderRadius: "20px",
                bgcolor: msg.is_mine ? colors.fourth : colors.third,
                color: colors.sixth,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography sx={{ fontSize: "0.95rem" }}>{msg.text}</Typography>
              <Box
                sx={{
                  alignSelf: "flex-end",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <Typography sx={{ fontSize: "0.7rem", color: colors.fiveth }}>
                  16:32
                </Typography>
                {msg.is_mine && (
                  <DoneAllIcon
                    sx={{
                      fontSize: 14,
                      color: msg.is_read ? colors.eighth : colors.fiveth,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Поле ввода */}
      <Box
        sx={{
          mt: 2,
          p: 1,
          bgcolor: colors.third,
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
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
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

export default ChatPage;
