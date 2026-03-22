import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import { useComposer } from "../../hooks/useComposer";
import { useMessageSender } from "../../hooks/useMessageSender";
import { getMyId } from "../../services/api";
import {
  activeChatSelectors,
  useActiveChatStore,
} from "../../stores/useActiveChatStore";
import ChatShell from "./ChatShell";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";
import ImageViewer from "../Ui/ImageViewer";
import { useChatListCacheActions } from "../../queries/chatListCache";
import { useChatDetailsQuery } from "../../queries/useChatDetailsQuery";
import { useChatMessagesQuery } from "../../queries/useChatMessagesQuery";
import { flattenMessagePages, useMessageCacheActions } from "../../queries/messageCache";

const ActiveChat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;
  const myId = getMyId();
  const { updateChatFromMessage } = useChatListCacheActions();
  const composerScopeId = chatId ? `chat:${chatId}` : "chat:none";

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const initializeRealtime = useActiveChatStore(
    activeChatSelectors.initializeRealtime,
  );
  const setCurrentChat = useActiveChatStore(activeChatSelectors.setCurrentChat);
  const typingUsers = useActiveChatStore(
    activeChatSelectors.typingUsers(chatId),
  );
  const { setMessages } = useMessageCacheActions(chatId);
  const {
    data: messagesData,
    isPending: isMsgsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesQuery(chatId);
  const { data: chatData } = useChatDetailsQuery(chatId);
  const messages = useMemo(
    () => flattenMessagePages(messagesData?.pages ?? []),
    [messagesData?.pages],
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
  }, [chatId, myId, setCurrentChat]);

  const { handleSend, handleModalSend } = useMessageSender({
    chatId: chatId!,
    replyTo,
    onReplyReset: () => setReplyTo(null),
    setMessages,
    handleUpdateChat: updateChatFromMessage,
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
            chatData={chatData ?? null}
            typingUsers={typingUsers}
            isMsgsLoading={isMsgsLoading}
            colors={colors}
          />
          <MessageList
            messages={messages}
            isMsgsLoading={isMsgsLoading}
            chatData={chatData ?? null}
            chatId={chatId}
            colors={colors}
            onImageClick={setFullScreenImage}
            onReply={setReplyTo}
            onLoadMore={() => fetchNextPage()}
            canLoadMore={Boolean(hasNextPage)}
            isLoadingMore={isFetchingNextPage}
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
