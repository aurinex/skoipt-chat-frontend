import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import { useComposer } from "../../hooks/useComposer";
import { useMessageSender } from "../../hooks/useMessageSender";
import { getMyId } from "../../services/api";
import { useChatsStore } from "../../stores/useChatsStore";
import { useActiveChatStore } from "../../stores/useActiveChatStore";
import ChatShell from "./ChatShell";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";
import ImageViewer from "../Ui/ImageViewer";
import type { Message, TypingUser } from "../../types";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING_USERS: TypingUser[] = [];

const ActiveChat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;
  const myId = getMyId();
  const handleUpdateChat = useChatsStore((state) => state.updateChatFromMessage);
  const composerScopeId = chatId ? `chat:${chatId}` : "chat:none";

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const initializeRealtime = useActiveChatStore(
    (state) => state.initializeRealtime,
  );
  const setCurrentChat = useActiveChatStore((state) => state.setCurrentChat);
  const loadChat = useActiveChatStore((state) => state.loadChat);
  const setMessagesForChat = useActiveChatStore(
    (state) => state.setMessagesForChat,
  );
  const messages = useActiveChatStore((state) =>
    chatId ? (state.messagesByChatId[chatId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const isMsgsLoading = useActiveChatStore((state) =>
    chatId ? (state.loadingByChatId[chatId] ?? false) : false,
  );
  const chatData = useActiveChatStore((state) =>
    chatId ? (state.chatDataByChatId[chatId] ?? null) : null,
  );
  const typingUsers = useActiveChatStore((state) =>
    chatId
      ? (state.typingUsersByChatId[chatId] ?? EMPTY_TYPING_USERS)
      : EMPTY_TYPING_USERS,
  );

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
    initializeRealtime();
  }, [initializeRealtime]);

  useEffect(() => {
    setCurrentChat(chatId ?? null, myId);

    if (chatId) {
      void loadChat(chatId);
    }
  }, [chatId, loadChat, myId, setCurrentChat]);

  const setMessages = useMemo(
    () => (updater: Message[] | ((prev: Message[]) => Message[])) => {
      if (!chatId) return;
      setMessagesForChat(chatId, updater);
    },
    [chatId, setMessagesForChat],
  );

  const { handleSend, handleModalSend } = useMessageSender({
    chatId: chatId!,
    replyTo,
    onReplyReset: () => setReplyTo(null),
    setMessages,
    handleUpdateChat,
    closeModal,
  });

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

  return (
    <>
      <ImageViewer
        open={!!fullScreenImage}
        src={fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
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
            chatData={chatData}
            typingUsers={typingUsers}
            isMsgsLoading={isMsgsLoading}
            colors={colors}
          />
          <MessageList
            messages={messages}
            isMsgsLoading={isMsgsLoading}
            chatData={chatData}
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
      </ChatShell>
    </>
  );
};

export default ActiveChat;
