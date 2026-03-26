import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Menu, MenuItem, Typography, useTheme } from "@mui/material";
import api, { getMyId } from "../../services/api";
import { useChatMembersQuery } from "../../queries/useChatMembersQuery";
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
import AcceptModal from "../Ui/AcceptModal";
import { useChatListCacheActions } from "../../queries/chatListCache";
import { useChatDetailsQuery } from "../../queries/useChatDetailsQuery";
import { useChatMessagesQuery } from "../../queries/useChatMessagesQuery";
import {
  flattenMessagePages,
  useMessageCacheActions,
} from "../../queries/messageCache";
import { canSendToChat } from "../../utils/permissions";
import type { Attachment, Message } from "../../types";
import { useResponsive } from "../../hooks/useResponsive";
import { collectUsersFromMessages, upsertUsers } from "../../stores/useUserStore";

const EMPTY_FILES: File[] = [];
const EMPTY_MESSAGE_PAGES: never[] = [];
const CONTEXT_PAGE_SIZE = 20;

const ActiveChat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const theme = useTheme();
  const colors = theme.palette.background;
  const { isMobile } = useResponsive();
  const myId = getMyId();
  const { updateChatFromMessage, setChatLastMessage } =
    useChatListCacheActions();
  const composerScopeId = chatId ? `chat:${chatId}` : "chat:none";
  const setEditingMessage = useComposerStore((s) => s.setEditingMessage);

  const [fullScreenImage, setFullScreenImage] = useState<Attachment | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Message | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);
  const [canLoadNewer, setCanLoadNewer] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    message: Message | null;
  } | null>(null);

  const initializeRealtime = useActiveChatStore(
    activeChatSelectors.initializeRealtime,
  );
  const setCurrentChat = useActiveChatStore(activeChatSelectors.setCurrentChat);
  const syncReadState = useActiveChatStore(activeChatSelectors.syncReadState);
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
  const { data: membersData } = useChatMembersQuery(
    chatId!,
    !!chatId && chatData?.type === "channel",
  );
  const messages = useMemo(
    () => flattenMessagePages(messagesData?.pages ?? EMPTY_MESSAGE_PAGES),
    [messagesData?.pages],
  );

  const canSendMessages = useMemo(() => {
    return canSendToChat(chatData, myId, membersData?.members);
  }, [chatData, myId, membersData]);

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const handleJumpToMessage = useCallback(
    async (messageId: string) => {
      if (!chatId) return;

      try {
        const context = await api.messages.getContext(chatId, messageId, {
          before: CONTEXT_PAGE_SIZE,
          after: CONTEXT_PAGE_SIZE,
        });
        const nextMessages = [
          ...context.before,
          context.target,
          ...context.after,
        ].filter(
          (message, index, array) =>
            array.findIndex((candidate) => candidate.id === message.id) === index,
        );

        upsertUsers(collectUsersFromMessages(nextMessages));
        setMessages(nextMessages);
        setJumpToMessageId(context.target.id);
        setCanLoadNewer(context.after.length >= CONTEXT_PAGE_SIZE);
      } catch (error) {
        console.error("Не удалось перейти к сообщению", error);
      }
    },
    [chatId, setMessages],
  );
  const handleLoadNewer = useCallback(async () => {
    if (!chatId || isLoadingNewer || !canLoadNewer || messages.length === 0) {
      return;
    }

    const newestLoadedMessage = messages[messages.length - 1];
    if (!newestLoadedMessage) return;

    setIsLoadingNewer(true);

    try {
      const context = await api.messages.getContext(chatId, newestLoadedMessage.id, {
        before: 0,
        after: CONTEXT_PAGE_SIZE,
      });
      const newerMessages = context.after ?? [];

      if (newerMessages.length > 0) {
        upsertUsers(collectUsersFromMessages(newerMessages));
        setMessages((prev) =>
          [...prev, ...newerMessages].filter(
            (message, index, array) =>
              array.findIndex((candidate) => candidate.id === message.id) === index,
          ),
        );
      }

      setCanLoadNewer(newerMessages.length >= CONTEXT_PAGE_SIZE);
    } catch (error) {
      console.error("РќРµ СѓРґР°Р»РѕСЃСЊ РґРѕРіСЂСѓР·РёС‚СЊ РЅРѕРІС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ", error);
    } finally {
      setIsLoadingNewer(false);
    }
  }, [canLoadNewer, chatId, isLoadingNewer, messages, setMessages]);
  const handleScrollToLatest = useCallback(async () => {
    if (!chatId) return;

    try {
      const latestMessages = await api.messages.list(chatId);
      upsertUsers(collectUsersFromMessages(latestMessages));
      setMessages(latestMessages);
      setCanLoadNewer(false);

      const latestId = latestMessages[latestMessages.length - 1]?.id;
      if (latestId) {
        setJumpToMessageId(latestId);
      }
    } catch (error) {
      console.error("РќРµ СѓРґР°Р»РѕСЃСЊ РїРµСЂРµР№С‚Рё РІ РєРѕРЅРµС† РґРёР°Р»РѕРіР°", error);
    }
  }, [chatId, setMessages]);
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
    (message: (typeof messages)[number]) =>
      setReplyTo(composerScopeId, message),
    [composerScopeId, setReplyTo],
  );
  const handleContextMenuOpen = useCallback(
    (data: {
      mouseX: number;
      mouseY: number;
      message: Message | null;
    }) => {
      setContextMenu(data);
    },
    [],
  );
  const handleDeleteRequest = useCallback(() => {
    if (!contextMenu?.message) return;
    setDeleteCandidate(contextMenu.message);
    setContextMenu(null);
  }, [contextMenu]);
  const handleDeleteCancel = useCallback(() => {
    if (isDeletingMessage) return;
    setDeleteCandidate(null);
  }, [isDeletingMessage]);
  const editingMessage = useComposerStore(
    (s) => s.composers[composerScopeId]?.editingMessage ?? null,
  );

  useEffect(() => {
    initializeRealtime();
  }, [initializeRealtime]);

  useEffect(() => {
    setCurrentChat(chatId ?? null, myId);
  }, [chatId, myId, setCurrentChat]);

  useEffect(() => {
    if (!chatId || messages.length === 0) return;
    syncReadState(chatId, messages);
  }, [chatId, messages, syncReadState]);

  useEffect(() => {
    setCanLoadNewer(false);
    setIsLoadingNewer(false);
    setJumpToMessageId(null);
  }, [chatId]);

  const { handleModalSend } = useMessageSender({
    chatId: chatId!,
    replyTo,
    onReplyReset: () => setReplyTo(composerScopeId, null),
    setMessages,
    handleUpdateChat: updateChatFromMessage,
    closeModal: handleCloseModal,
    editingMessage,
    setEditingMessage: (msg) => setEditingMessage(composerScopeId, msg),
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!chatId || !deleteCandidate || isDeletingMessage) return;

    setIsDeletingMessage(true);

    try {
      await api.messages.delete(chatId, deleteCandidate.id);

      const nextMessages = messages.filter((msg) => msg.id !== deleteCandidate.id);
      const nextLastMessage =
        [...nextMessages].reverse().find((msg) => !msg.is_system) ?? null;

      setMessages(nextMessages);
      setChatLastMessage(chatId, nextLastMessage);

      if (editingMessage?.id === deleteCandidate.id) {
        setEditingMessage(composerScopeId, null);
      }

      if (replyTo?.id === deleteCandidate.id) {
        setReplyTo(composerScopeId, null);
      }

      setDeleteCandidate(null);
    } catch (error) {
      console.error("Ошибка удаления сообщения", error);
    } finally {
      setIsDeletingMessage(false);
    }
  }, [
    chatId,
    composerScopeId,
    deleteCandidate,
    editingMessage,
    isDeletingMessage,
    messages,
    replyTo,
    setChatLastMessage,
    setEditingMessage,
    setMessages,
    setReplyTo,
  ]);

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
        attachment={fullScreenImage}
        chatId={chatId}
        onClose={() => setFullScreenImage(null)}
      />
      <AcceptModal
        open={!!deleteCandidate}
        title="Удалить сообщение?"
        description="Сообщение будет удалено из чата. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        loading={isDeletingMessage}
        colors={colors}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
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
            height: "100%",
            minHeight: 0,
            p: isMobile ? 1.5 : 2,
            bgcolor: colors.third,
          }}
        >
          <ChatHeader
            chatData={chatData ?? null}
            typingUsers={typingUsers}
            isMsgsLoading={isMsgsLoading}
            colors={colors}
            onJumpToMessage={handleJumpToMessage}
          />
          <MessageList
            messages={messages}
            isMsgsLoading={isMsgsLoading}
            chatData={chatData ?? null}
            chatId={chatId}
            colors={colors}
            onImageClick={({ attachment }) => setFullScreenImage(attachment)}
            onReply={handleReplySelect}
            onLoadMore={handleLoadMore}
            canLoadMore={Boolean(hasNextPage)}
            isLoadingMore={isFetchingNextPage}
            onContextMenuOpen={handleContextMenuOpen}
            onLoadNewer={handleLoadNewer}
            canLoadNewer={canLoadNewer}
            isLoadingNewer={isLoadingNewer}
            jumpToMessageId={jumpToMessageId}
            onJumpHandled={() => setJumpToMessageId(null)}
            onJumpToMessage={handleJumpToMessage}
            onScrollToLatest={handleScrollToLatest}
          />
          {canSendMessages && (
            <ActiveChatComposer
              chatId={chatId}
              composerScopeId={composerScopeId}
              colors={colors}
              setMessages={setMessages}
              handleUpdateChat={updateChatFromMessage}
              messages={messages}
            />
          )}
          <Menu
            keepMounted
            open={!!contextMenu}
            onClose={() => setContextMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem
              onClick={() => {
                if (!contextMenu?.message) return;
                setEditingMessage(composerScopeId, contextMenu.message);
                setContextMenu(null);
              }}
            >
              Редактировать
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleDeleteRequest();
              }}
            >
              Удалить
            </MenuItem>
          </Menu>
        </Box>
      </ChatShell>
    </>
  );
};

export default ActiveChat;
