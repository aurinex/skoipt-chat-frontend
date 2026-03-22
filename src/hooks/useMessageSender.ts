import { useCallback } from "react";
import api, { getMyId } from "../services/api";
import type { Message } from "../types";

interface UseMessageSenderParams {
  chatId: string;
  replyTo: Message | null;
  onReplyReset: () => void;
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  handleUpdateChat: (msg: Message) => void;
  closeModal: () => void;
}

/**
 * Вся логика отправки сообщений — текст и файлы.
 * Включает оптимистичные обновления и обработку ошибок.
 */
export const useMessageSender = ({
  chatId,
  replyTo,
  onReplyReset,
  setMessages,
  handleUpdateChat,
  closeModal,
}: UseMessageSenderParams) => {
  const myId = getMyId() ?? "";

  const handleSend = useCallback(
    async (text: string, replyToId?: string) => {
      if (!text.trim() || !chatId) return;

      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          chat_id: chatId,
          text,
          is_mine: true,
          sender_id: myId,
          created_at: new Date().toISOString(),
          read_by: [],
          file_urls: [],
          is_edited: false,
          edited_at: null,
          _pending: true,
          reply_to: replyToId || null,
          reply_to_message: replyTo || null,
        },
      ]);

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
        onReplyReset();
        handleUpdateChat(msg);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, _pending: false, _failed: true } : m,
          ),
        );
      }
    },
    [chatId, myId, replyTo, onReplyReset, setMessages, handleUpdateChat],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      if (!chatId) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const nonImageFiles = files.filter((f) => !f.type.startsWith("image/"));
      const blobUrls = imageFiles.map((f) => URL.createObjectURL(f));
      const tempId = `temp_files_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          chat_id: chatId,
          text: caption || null,
          is_mine: true,
          sender_id: myId,
          created_at: new Date().toISOString(),
          read_by: [],
          file_urls: blobUrls,
          is_edited: false,
          edited_at: null,
          _uploading: true,
          _nonImageCount: nonImageFiles.length,
          reply_to: replyTo?.id || null,
          reply_to_message: replyTo || null,
        },
      ]);
      closeModal();

      try {
        const results = await Promise.allSettled(
          files.map((file) => api.files.uploadChatFile(chatId, file)),
        );

        const fileUrls: string[] = [];
        results.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const res = result.value;
            fileUrls.push(res.is_public ? res.url : res.object_name);
          } else {
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

        const msg = await api.messages.send(chatId, {
          file_urls: fileUrls,
          text: caption || null,
          reply_to: replyTo?.id || null,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...msg, reply_to_message: replyTo } : m,
          ),
        );
        onReplyReset();
        handleUpdateChat(msg);
      } catch {
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
      replyTo,
      onReplyReset,
      setMessages,
      handleUpdateChat,
      closeModal,
    ],
  );

  return { handleSend, handleModalSend };
};
