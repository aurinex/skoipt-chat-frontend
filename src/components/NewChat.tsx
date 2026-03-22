import { useCallback, useState, useEffect } from "react";
import {
  useSearchParams,
  useOutletContext,
  useNavigate,
} from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import api, { getMyId } from "../services/api";
import ChatHeader from "./Chat/ChatHeader";
import MessageInput from "./MessageInput";
import DropZoneOverlay from "./DropZoneOverlay";
import FileUploadModal from "./FileUploadModal";
import ReplyPreview from "./ReplyPreview";

interface ContextType {
  handleUpdateChat: (msg: any) => void;
}

const NewChat = () => {
  const { handleUpdateChat } = useOutletContext<ContextType>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = theme.palette.background;

  const userId = searchParams.get("userId");
  const myId = getMyId();

  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [draftText, setDraftText] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialCaption, setModalInitialCaption] = useState("");

  useEffect(() => {
    if (!userId) return;

    setPreviewLoading(true);
    api.users
      .chatPreview(userId)
      .then((data) => {
        if (data.chat_id) {
          navigate(`/chat/${data.chat_id}`, { replace: true });
        } else {
          setPreview(data);
        }
      })
      .catch((e) => console.error("Ошибка загрузки превью:", e))
      .finally(() => setPreviewLoading(false));
  }, [userId]);

  const openModal = useCallback(
    (files: File[]) => {
      setModalFiles((prev) => [...prev, ...files].slice(0, 10));
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

  // Отправка текстового сообщения
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId) return;

      try {
        const result = await api.chats.sendFirstMessage(userId, { text });
        console.log("result.message:", result.message);
        console.log("myId:", getMyId());
        handleUpdateChat(result.message);
        navigate(`/chat/${result.chat_id}`, { replace: true });
      } catch (err) {
        console.error("Ошибка отправки:", err);
      }
    },
    [userId, navigate, handleUpdateChat],
  );

  // Отправка файлов: сначала создаём чат через openDirect,
  // потом загружаем файлы в него, потом отправляем сообщение
  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      if (!userId) return;
      closeModal();

      try {
        // Шаг 1 — создаём чат (или получаем существующий)
        const chat = await api.chats.openDirect(userId);
        const chatId = chat.id;

        // Шаг 2 — загружаем файлы
        const uploadResults = await Promise.allSettled(
          files.map((file) => api.files.uploadChatFile(chatId, file)),
        );

        const fileUrls: string[] = [];
        uploadResults.forEach((r) => {
          if (r.status === "fulfilled") {
            fileUrls.push(
              r.value.is_public ? r.value.url : r.value.object_name,
            );
          }
        });

        if (fileUrls.length === 0 && !caption.trim()) return;

        // Шаг 3 — отправляем сообщение с файлами
        const msg = await api.messages.send(chatId, {
          text: caption || null,
          file_urls: fileUrls,
        });

        handleUpdateChat(msg);
        navigate(`/chat/${chatId}`, { replace: true });
      } catch (err) {
        console.error("Ошибка отправки файлов:", err);
      }
    },
    [userId, navigate, handleUpdateChat, closeModal],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) openModal(files);
      e.target.value = "";
    },
    [openModal],
  );

  if (!userId) {
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
          Пользователь не указан
        </Typography>
      </Box>
    );
  }

  return (
    <DropZoneOverlay onFilesDrop={openModal} colors={colors}>
      <FileUploadModal
        open={modalOpen}
        files={modalFiles}
        onClose={closeModal}
        onSend={handleModalSend}
        onAddMore={(f) => setModalFiles((prev) => [...prev, ...f].slice(0, 10))}
        onRemove={(i) =>
          setModalFiles((prev) => {
            const updated = prev.filter((_, idx) => idx !== i);
            if (updated.length === 0) setModalOpen(false);
            return updated;
          })
        }
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
          chatData={preview}
          typingUsers={[]}
          isMsgsLoading={previewLoading}
          colors={colors}
        />

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ color: colors.fiveth, fontSize: 14 }}>
            Напишите первое сообщение
          </Typography>
        </Box>

        <ReplyPreview
          replyTo={replyTo}
          onCancel={() => setReplyTo(null)}
          colors={colors}
        />
        <MessageInput
          chatId={undefined}
          onSend={handleSend}
          onFileUpload={handleFileInputChange}
          value={draftText}
          onChange={setDraftText}
          colors={colors}
          replyTo={replyTo}
        />
      </Box>
    </DropZoneOverlay>
  );
};

export default NewChat;
