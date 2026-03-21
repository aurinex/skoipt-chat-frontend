import { useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import api from "../services/api";
import { useChat } from "../hooks/useChat";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ActiveChatProps {
  onMessageSent?: (msg: any) => void;
}

interface ContextType {
  handleUpdateChat: (msg: any) => void;
}

const ActiveChat = (props: ActiveChatProps) => {
  const { handleUpdateChat } = useOutletContext<ContextType>();
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;

  const myId = localStorage.getItem("user_id");

  const { messages, setMessages, isMsgsLoading, chatData, typingUsers } =
    useChat(chatId, myId);

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

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !chatId) return;

      // Оптимистичное сообщение — появляется мгновенно до ответа сервера
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        chat_id: chatId,
        text,
        is_mine: true,
        sender_id: myId,
        created_at: new Date().toISOString(),
        read_by: [],
        _pending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const msg = await api.messages.send(chatId, { text });
        // Заменяем временное сообщение на реальное от сервера
        setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
        handleUpdateChat(msg);
      } catch (err) {
        console.error("Ошибка отправки:", err);
        // Помечаем как failed — пользователь видит индикатор ошибки
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, _pending: false, _failed: true } : m,
          ),
        );
      }
    },
    [chatId, myId, handleUpdateChat],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !chatId) return;

      try {
        const res = await api.files.uploadChatFile(chatId, file);
        const fileUrl = res.is_public ? res.url : res.object_name;
        const msg = await api.messages.send(chatId, { file_url: fileUrl });
        setMessages((prev) => [...prev, msg]);
        handleUpdateChat(msg);
      } catch (err) {
        console.error("Ошибка загрузки файла:", err);
      }

      e.target.value = "";
    },
    [chatId, handleUpdateChat],
  );

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
      <ChatHeader
        chatData={chatData}
        typingUsers={typingUsers}
        isMsgsLoading={isMsgsLoading}
        colors={colors}
      />

      <MessageList
        messages={messages}
        isMsgsLoading={isMsgsLoading}
        chatData={chatData}
        myId={myId}
        chatId={chatId}
        colors={colors}
      />

      <MessageInput
        chatId={chatId}
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        colors={colors}
      />
    </Box>
  );
};

export default ActiveChat;
