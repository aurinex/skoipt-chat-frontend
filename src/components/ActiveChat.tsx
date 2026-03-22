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
import ImageViewer from "./ImageViewer";
import ReplyPreview from "./ReplyPreview";

interface ActiveChatProps {
  onMessageSent?: (msg: any) => void;
}

interface ContextType {
  handleUpdateChat: (msg: any) => void;
}

const ALLOWED_IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;

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

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const [draftText, setDraftText] = useState("");
  const [modalInitialCaption, setModalInitialCaption] = useState("");

  const [replyTo, setReplyTo] = useState<any | null>(null);

  const openModal = useCallback(
    (files: File[]) => {
      setModalFiles((prev) => {
        const combined = [...prev, ...files];
        return combined.slice(0, 10);
      });

      if (draftText.trim()) {
        setModalInitialCaption(draftText);
        setDraftText("");
      }

      setModalOpen(true);
    },
    [draftText],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalFiles([]);
    setModalInitialCaption("");
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
    async (text: string, replyToId?: string) => {
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
        reply_to: replyToId || null,
        reply_to_message: replyTo || null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const msg = await api.messages.send(chatId, {
          text,
          reply_to: replyToId || null,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...msg, reply_to_message: replyTo } : m,
          ),
        );
        setReplyTo(null);
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
    [chatId, myId, handleUpdateChat, replyTo],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      if (!chatId) return;

      // Создаём blob URL для изображений — для мгновенного превью
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const nonImageFiles = files.filter((f) => !f.type.startsWith("image/"));
      const blobUrls = imageFiles.map((f) => URL.createObjectURL(f));

      const tempId = `temp_files_${Date.now()}`;

      // Оптимистичный плейсхолдер — виден сразу пока идёт загрузка
      const optimisticMsg = {
        id: tempId,
        chat_id: chatId,
        text: caption || null,
        is_mine: true,
        sender_id: myId,
        created_at: new Date().toISOString(),
        read_by: [],
        file_urls: blobUrls, // blob URL для превью изображений
        _uploading: true, // флаг — идёт загрузка
        _nonImageCount: nonImageFiles.length, // сколько не-изображений показать плейсхолдером
        reply_to: replyTo?.id || null,
        reply_to_message: replyTo || null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      closeModal();

      try {
        const results = await Promise.allSettled(
          files.map((file) => api.files.uploadChatFile(chatId, file)),
        );

        const fileUrls: string[] = [];
        const failedFiles: string[] = [];

        results.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const res = result.value;
            fileUrls.push(res.is_public ? res.url : res.object_name);
          } else {
            failedFiles.push(files[i].name);
            console.error(
              `Не удалось загрузить ${files[i].name}:`,
              result.reason,
            );
          }
        });

        if (fileUrls.length === 0) {
          // Все файлы упали — помечаем как failed
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...m, _uploading: false, _failed: true, file_urls: [] }
                : m,
            ),
          );
          // Освобождаем blob URL
          blobUrls.forEach(URL.revokeObjectURL);
          return;
        }

        const msg = await api.messages.send(chatId, {
          file_urls: fileUrls,
          text: caption || null,
          reply_to: replyTo?.id || null,
        });

        // Заменяем плейсхолдер реальным сообщением
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...msg, reply_to_message: replyTo } : m,
          ),
        );
        setReplyTo(null);
        handleUpdateChat(msg);

        if (failedFiles.length > 0) {
          console.warn(`Не удалось загрузить: ${failedFiles.join(", ")}`);
        }
      } catch (err) {
        console.error("Ошибка отправки файлов:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, _uploading: false, _failed: true, file_urls: [] }
              : m,
          ),
        );
      } finally {
        // Освобождаем blob URL в любом случае
        blobUrls.forEach(URL.revokeObjectURL);
      }
    },
    [chatId, myId, handleUpdateChat, closeModal, replyTo],
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
      <ImageViewer
        open={!!fullScreenImage}
        src={fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
      <DropZoneOverlay onFilesDrop={openModal} colors={colors}>
        <FileUploadModal
          open={modalOpen}
          files={modalFiles}
          onClose={closeModal}
          onSend={handleModalSend}
          onAddMore={handleAddMoreFiles}
          onRemove={handleRemoveFile}
          initialCaption={modalInitialCaption}
          colors={colors}
        />
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
            onImageClick={setFullScreenImage}
            onReply={setReplyTo}
          />
          <ReplyPreview
            replyTo={replyTo}
            onCancel={() => setReplyTo(null)}
            colors={colors}
          />
          <MessageInput
            chatId={chatId}
            onSend={handleSend}
            onFileUpload={handleFileInputChange}
            value={draftText}
            onChange={setDraftText}
            colors={colors}
            replyTo={replyTo}
          />
        </Box>
      </DropZoneOverlay>
    </>
  );
};

export default ActiveChat;
