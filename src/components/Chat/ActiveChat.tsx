import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import { getMyId } from "../../services/api";
import { useMessageSender } from "../../hooks/useMessageSender";
import {
  activeChatSelectors,
  useActiveChatStore,
} from "../../stores/useActiveChatStore";
import { useComposerStore } from "../../stores/useComposerStore";
import ChatShell from "./ChatShell";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ActiveChatComposer from "./ActiveChatComposer";
import ImageViewer from "../Ui/ImageViewer";
import { useChatListCacheActions } from "../../queries/chatListCache";
import { useChatDetailsQuery } from "../../queries/useChatDetailsQuery";
import { useChatMessagesQuery } from "../../queries/useChatMessagesQuery";
import { flattenMessagePages, useMessageCacheActions } from "../../queries/messageCache";

const EMPTY_FILES: File[] = [];
const EMPTY_MESSAGE_PAGES: never[] = [];

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
    () => flattenMessagePages(messagesData?.pages ?? EMPTY_MESSAGE_PAGES),
    [messagesData?.pages],
  );
  const canSendMessages = useMemo(() => {
    if (!chatData || !myId) return true;
    if (chatData.type !== "channel") return true;

    return chatData.admins?.includes(myId) ?? false;
  }, [chatData, myId]);
  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const modalFiles = useComposerStore(
    (state) => state.composers[composerScopeId]?.modalFiles ?? EMPTY_FILES,
  );
  const modalOpen = useComposerStore(
    (state) => state.composers[composerScopeId]?.modalOpen ?? false,
  );
  const modalInitialCaption = useComposerStore(
    (state) => state.composers[composerScopeId]?.modalInitialCaption ?? "",
  );
  const replyTo = useComposerStore(
    (state) => state.composers[composerScopeId]?.replyTo ?? null,
  );
  const openModal = useComposerStore((state) => state.openModal);
  const closeModal = useComposerStore((state) => state.closeModal);
  const addFiles = useComposerStore((state) => state.addFiles);
  const removeFile = useComposerStore((state) => state.removeFile);
  const setReplyTo = useComposerStore((state) => state.setReplyTo);

  const handleOpenModal = useCallback(
    (files: File[]) => openModal(composerScopeId, files),
    [composerScopeId, openModal],
  );
  const handleCloseModal = useCallback(
    () => closeModal(composerScopeId),
    [closeModal, composerScopeId],
  );
  const handleAddFiles = useCallback(
    (files: File[]) => addFiles(composerScopeId, files),
    [addFiles, composerScopeId],
  );
  const handleRemoveFile = useCallback(
    (index: number) => removeFile(composerScopeId, index),
    [composerScopeId, removeFile],
  );
  const handleReplySelect = useCallback(
    (message: (typeof messages)[number]) => setReplyTo(composerScopeId, message),
    [composerScopeId, setReplyTo],
  );

  useEffect(() => {
    initializeRealtime();
  }, [initializeRealtime]);

  useEffect(() => {
    setCurrentChat(chatId ?? null, myId);
  }, [chatId, myId, setCurrentChat]);

  const { handleModalSend } = useMessageSender({
    chatId: chatId!,
    replyTo,
    onReplyReset: () => setReplyTo(composerScopeId, null),
    setMessages,
    handleUpdateChat: updateChatFromMessage,
    closeModal: handleCloseModal,
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
        onModalClose={handleCloseModal}
        onModalSend={handleModalSend}
        onAddMoreFiles={handleAddFiles}
        onRemoveFile={handleRemoveFile}
        onFilesDrop={handleOpenModal}
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
            onReply={handleReplySelect}
            onLoadMore={handleLoadMore}
            canLoadMore={Boolean(hasNextPage)}
            isLoadingMore={isFetchingNextPage}
          />
          {canSendMessages && (
            <ActiveChatComposer
              chatId={chatId}
              composerScopeId={composerScopeId}
              colors={colors}
              setMessages={setMessages}
              handleUpdateChat={updateChatFromMessage}
            />
          )}
        </Box>
      </ChatShell>
    </>
  );
};

export default ActiveChat;
