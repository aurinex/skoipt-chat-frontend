import { useCallback } from "react";
import api, { getMyId } from "../services/api";
import { useSendMessageMutation } from "../queries/useChatMutations";
import type { Attachment, Message } from "../types";
import { buildAttachmentFromUpload } from "../utils/messageAttachments";

interface UseMessageSenderParams {
  chatId: string;
  replyTo: Message | null;
  onReplyReset: () => void;
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  handleUpdateChat: (msg: Message) => void;
  closeModal: () => void;

  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
}

export const useMessageSender = ({
  chatId,
  replyTo,
  onReplyReset,
  setMessages,
  handleUpdateChat,
  closeModal,
  editingMessage,
  setEditingMessage,
}: UseMessageSenderParams) => {
  const myId = getMyId() ?? "";
  const sendMessageMutation = useSendMessageMutation();

  const handleSend = useCallback(
    async (text: string, replyToId?: string) => {
      if (!text.trim() || !chatId) return;

      if (editingMessage) {
        try {
          await api.messages.edit(chatId, editingMessage.id, text);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === editingMessage.id
                ? {
                    ...m,
                    text,
                    is_edited: true,
                    edited_at: new Date().toISOString(),
                  }
                : m,
            ),
          );

          setEditingMessage(null);
        } catch {
          console.error("Ошибка редактирования");
        }

        return;
      }

      const tempId = `temp_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          chat_id: chatId,
          type: "text",
          text,
          is_mine: true,
          sender_id: myId,
          created_at: new Date().toISOString(),
          read_by: [],
          attachments: [],
          file_urls: [],
          is_edited: false,
          edited_at: null,
          _pending: true,
          reply_to: replyToId || null,
          reply_to_message: replyTo || null,
        },
      ]);

      try {
        const msg = await sendMessageMutation.mutateAsync({
          chatId,
          data: {
            text,
            type: "text",
            reply_to: replyToId || null,
          },
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
    [
      chatId,
      myId,
      replyTo,
      onReplyReset,
      sendMessageMutation,
      setMessages,
      handleUpdateChat,
      editingMessage,
      setEditingMessage,
    ],
  );

  const handleModalSend = useCallback(
    async (files: File[], caption: string): Promise<void> => {
      if (!chatId) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const nonImageFiles = files.filter((f) => !f.type.startsWith("image/"));
      const tempAttachments: Attachment[] = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          kind: file.type.startsWith("image/") ? "image" : "file",
          url: previewUrl,
          is_public: true,
          mime_type: file.type,
          filename: file.name,
          size_bytes: file.size,
        };
      });
      const tempId = `temp_files_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          chat_id: chatId,
          type: imageFiles.length === files.length ? "image" : "file",
          text: caption || null,
          is_mine: true,
          sender_id: myId,
          created_at: new Date().toISOString(),
          read_by: [],
          attachments: tempAttachments,
          file_urls: tempAttachments.map((attachment) => attachment.url ?? ""),
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

        const attachments: Attachment[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            attachments.push(buildAttachmentFromUpload(files[index], result.value));
          }
        });

        if (attachments.length === 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...m, _uploading: false, _failed: true, attachments: [] }
                : m,
            ),
          );
          return;
        }

        const msg = await sendMessageMutation.mutateAsync({
          chatId,
          data: {
            type:
              attachments.length === 1 && attachments[0].kind === "voice"
                ? "voice"
                : attachments.every((attachment) => attachment.kind === "image")
                  ? "image"
                  : "file",
            attachments,
            text: caption || null,
            reply_to: replyTo?.id || null,
          },
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
              ? { ...m, _uploading: false, _failed: true, attachments: [] }
              : m,
          ),
        );
      } finally {
        tempAttachments.forEach((attachment) => {
          if (attachment.url?.startsWith("blob:")) {
            URL.revokeObjectURL(attachment.url);
          }
        });
      }
    },
    [
      chatId,
      myId,
      replyTo,
      onReplyReset,
      sendMessageMutation,
      setMessages,
      handleUpdateChat,
      closeModal,
    ],
  );

  return { handleSend, handleModalSend };
};
