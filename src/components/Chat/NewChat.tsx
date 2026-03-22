import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import api from "../../services/api";
import { useComposer } from "../../hooks/useComposer";
import type { ChatPreview } from "../../types";
import ChatShell from "./ChatShell";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";

const NewChat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = theme.palette.background;

  const userId = searchParams.get("userId");
  const composerScopeId = userId ? `new-chat:${userId}` : "new-chat:none";

  const [preview, setPreview] = useState<ChatPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const {
    draftText,
    setDraftText,
    replyTo,
    setReplyTo,
    modalFiles,
    modalOpen,
    modalInitialCaption,
    openModal,
    closeModal,
    addFiles,
    removeFile,
    handleFileInputChange,
  } = useComposer(composerScopeId);

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

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId) return;
      try {
        const result = await api.chats.sendFirstMessage(userId, { text });
        navigate(`/chat/${result.chat_id}`, { replace: true });
      } catch (err) {
        console.error("Ошибка отправки:", err);
      }
    },
    [userId, navigate],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      if (!userId) return;
      closeModal();
      try {
        const chat = await api.chats.openDirect(userId);
        const chatId = chat.id;

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

        await api.messages.send(chatId, {
          text: caption || null,
          file_urls: fileUrls,
        });
        navigate(`/chat/${chatId}`, { replace: true });
      } catch (err) {
        console.error("Ошибка отправки файлов:", err);
      }
    },
    [userId, navigate, closeModal],
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
    <ChatShell
      modalOpen={modalOpen}
      modalFiles={modalFiles}
      modalInitialCaption={modalInitialCaption}
      onModalClose={closeModal}
      onModalSend={handleModalSend}
      onAddMoreFiles={addFiles}
      onRemoveFile={removeFile}
      onFilesDrop={openModal}
    >
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
    </ChatShell>
  );
};

export default NewChat;
