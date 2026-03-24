import { memo } from "react";
import { useComposer } from "../../hooks/useComposer";
import { useMessageSender } from "../../hooks/useMessageSender";
import type { Message } from "../../types";
import type { AppColors } from "../../types/theme";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";
import EditPreview from "../Layout/EditPreview";

interface ActiveChatComposerProps {
  chatId: string;
  composerScopeId: string;
  colors: AppColors;
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  handleUpdateChat: (message: Message) => void;
  messages: Message[];
}

const ActiveChatComposer = ({
  chatId,
  composerScopeId,
  colors,
  setMessages,
  handleUpdateChat,
  messages,
}: ActiveChatComposerProps) => {
  const {
    draftText,
    setDraftText,
    replyTo,
    setReplyTo,
    closeModal,
    handleFileInputChange,
    editingMessage,
    setEditingMessage,
  } = useComposer(composerScopeId);

  const lastMyMessage = [...messages]
    .reverse()
    .find((m) => m.is_mine && !m._failed);

  const { handleSend } = useMessageSender({
    chatId,
    replyTo,
    onReplyReset: () => setReplyTo(null),
    setMessages,
    handleUpdateChat,
    closeModal,
    editingMessage,
    setEditingMessage,
  });

  return (
    <>
      <ReplyPreview
        replyTo={replyTo}
        onCancel={() => setReplyTo(null)}
        colors={colors}
      />
      <EditPreview
        message={editingMessage}
        onCancel={() => setEditingMessage(null)}
      />
      <MessageInput
        chatId={chatId}
        onSend={handleSend}
        onFileUpload={handleFileInputChange}
        value={draftText}
        onChange={setDraftText}
        colors={colors}
        replyTo={replyTo}
        onCancelEdit={() => setEditingMessage(null)}
        editing={!!editingMessage}
        onEditLastMessage={() => {
          if (lastMyMessage) {
            setEditingMessage(lastMyMessage);
          }
        }}
      />
    </>
  );
};

export default memo(ActiveChatComposer);
