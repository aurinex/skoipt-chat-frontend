import { useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import { useChat } from "../../hooks/useChat";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useMessageSender } from "../../hooks/useMessageSender";
import type { Message } from "../../types";
import { useChatsStore } from "../../stores/useChatsStore";
import ChatShell from "./ChatShell";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";
import ImageViewer from "../Ui/ImageViewer";

const ActiveChat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;
  const handleUpdateChat = useChatsStore((state) => state.updateChatFromMessage);

  const [draftText, setDraftText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const { messages, setMessages, isMsgsLoading, chatData, typingUsers } =
    useChat(chatId, null);

  const {
    modalFiles,
    modalOpen,
    modalInitialCaption,
    openModal,
    closeModal,
    addFiles,
    removeFile,
    handleFileInputChange,
  } = useFileUpload(draftText, () => setDraftText(""));

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
