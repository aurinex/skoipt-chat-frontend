import { useCallback, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import api from "../services/api";
import { useChat } from "../hooks/useChat";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import DropZoneOverlay from "./DropZoneOverlay";
import FileUploadModal from "./FileUploadModal";

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

  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback((files: File[]) => {
    if (!files.length) return;
    setModalFiles(files.slice(0, 10));
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalFiles([]);
  }, []);

  const handleAddMoreFiles = useCallback((newFiles: File[]) => {
    setModalFiles((prev) => [...prev, ...newFiles].slice(0, 10));
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setModalFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setModalOpen(false);
      return updated;
    });
  }, []);

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
        setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
        handleUpdateChat(msg);
      } catch (err) {
        console.error("Ошибка отправки:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, _pending: false, _failed: true } : m,
          ),
        );
      }
    },
    [chatId, myId, handleUpdateChat],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string) => {
      if (!chatId) return;
      closeModal();

      try {
        const uploaded = await Promise.all(
          files.map((file) => api.files.uploadChatFile(chatId, file)),
        );
        const fileUrls = uploaded.map((res) =>
          res.is_public ? res.url : res.object_name,
        );
        const msg = await api.messages.send(chatId, {
          file_urls: fileUrls,
          text: caption || null,
        });
        setMessages((prev) => [...prev, msg]);
        handleUpdateChat(msg);
      } catch (err) {
        console.error("Ошибка отправки файлов:", err);
      }
    },
    [chatId, handleUpdateChat, closeModal],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) openModal(files);
      e.target.value = "";
    },
    [openModal],
  );

  return (
    <>
      <FileUploadModal
        open={modalOpen}
        files={modalFiles}
        onClose={closeModal}
        onSend={handleModalSend}
        onAddMore={handleAddMoreFiles}
        onRemove={handleRemoveFile}
        colors={colors}
      />

      <DropZoneOverlay onFilesDrop={openModal} colors={colors}>
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
            onFileUpload={handleFileInputChange}
            colors={colors}
          />
        </Box>
      </DropZoneOverlay>
    </>
  );
};

export default ActiveChat;
