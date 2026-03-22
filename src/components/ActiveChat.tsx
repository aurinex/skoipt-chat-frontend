import { useCallback, useState, useEffect } from "react";
import {
  useParams,
  useOutletContext,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import api from "../services/api";
import { useChat } from "../hooks/useChat";
import ChatHeader from "./Chat/ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import DropZoneOverlay from "./DropZoneOverlay";
import FileUploadModal from "./FileUploadModal";
import ImageViewer from "./ImageViewer";
import ReplyPreview from "./ReplyPreview";

interface ContextType {
  handleUpdateChat: (msg: any) => void;
}

const ActiveChat = () => {
  const { handleUpdateChat } = useOutletContext<ContextType>();
  const { chatId } = useParams<{ chatId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = theme.palette.background;

  const myId = localStorage.getItem("user_id");

  const pendingUserId = searchParams.get("userId");
  const isNewChat = !chatId && !!pendingUserId;

  // Превью для нового чата — загружается с бека
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ВСЕ хуки до любых return
  const { messages, setMessages, isMsgsLoading, chatData, typingUsers } =
    useChat(isNewChat ? null : chatId, myId);

  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [modalInitialCaption, setModalInitialCaption] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);

  useEffect(() => {
    if (!isNewChat || !pendingUserId) return;

    setPreviewLoading(true);
    api.users
      .chatPreview(pendingUserId)
      .then((data) => {
        if (data.chat_id) {
          // Чат уже существует — редиректим сразу
          navigate(`/chat/${data.chat_id}`, { replace: true });
        } else {
          setPreview(data);
        }
      })
      .catch((e) => console.error("Ошибка загрузки превью:", e))
      .finally(() => setPreviewLoading(false));
  }, [isNewChat, pendingUserId]);

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

  // Ранний return — ТОЛЬКО после всех хуков
  if (!chatId && !isNewChat) {
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

  const resolveChat = async (): Promise<string | null> => {
    if (!isNewChat) return chatId!;
    if (!pendingUserId) return null;
    try {
      const chat = await api.chats.openDirect(pendingUserId);
      navigate(`/chat/${chat.id}`, { replace: true });
      return chat.id;
    } catch (e) {
      console.error("Не удалось создать чат:", e);
      return null;
    }
  };

  const handleSend = useCallback(
    async (text: string, replyToId?: string) => {
      if (!text.trim()) return;

      const resolvedChatId = await resolveChat();
      if (!resolvedChatId) return;

      const tempId = `temp_${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        chat_id: resolvedChatId,
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
        const msg = await api.messages.send(resolvedChatId, {
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
    [chatId, myId, handleUpdateChat, replyTo, isNewChat, pendingUserId],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      const resolvedChatId = await resolveChat();
      if (!resolvedChatId) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const nonImageFiles = files.filter((f) => !f.type.startsWith("image/"));
      const blobUrls = imageFiles.map((f) => URL.createObjectURL(f));

      const tempId = `temp_files_${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        chat_id: resolvedChatId,
        text: caption || null,
        is_mine: true,
        sender_id: myId,
        created_at: new Date().toISOString(),
        read_by: [],
        file_urls: blobUrls,
        _uploading: true,
        _nonImageCount: nonImageFiles.length,
        reply_to: replyTo?.id || null,
        reply_to_message: replyTo || null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      closeModal();

      try {
        const results = await Promise.allSettled(
          files.map((file) => api.files.uploadChatFile(resolvedChatId, file)),
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...m, _uploading: false, _failed: true, file_urls: [] }
                : m,
            ),
          );
          blobUrls.forEach(URL.revokeObjectURL);
          return;
        }

        const msg = await api.messages.send(resolvedChatId, {
          file_urls: fileUrls,
          text: caption || null,
          reply_to: replyTo?.id || null,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...msg, reply_to_message: replyTo } : m,
          ),
        );
        setReplyTo(null);
        handleUpdateChat(msg);
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
        blobUrls.forEach(URL.revokeObjectURL);
      }
    },
    [
      chatId,
      myId,
      handleUpdateChat,
      closeModal,
      replyTo,
      isNewChat,
      pendingUserId,
    ],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) openModal(files);
      e.target.value = "";
    },
    [openModal],
  );

  const effectiveChatData = isNewChat ? preview : chatData;

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
            chatData={effectiveChatData}
            typingUsers={typingUsers}
            isMsgsLoading={isNewChat ? previewLoading : isMsgsLoading}
            colors={colors}
          />

          {isNewChat ? (
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
          ) : (
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
          )}

          <ReplyPreview
            replyTo={replyTo}
            onCancel={() => setReplyTo(null)}
            colors={colors}
          />
          <MessageInput
            chatId={isNewChat ? undefined : chatId}
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
