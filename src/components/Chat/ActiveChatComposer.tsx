import { memo } from "react";
import { useComposer } from "../../hooks/useComposer";
import { useMessageSender } from "../../hooks/useMessageSender";
import type { Message } from "../../types";
import type { AppColors } from "../../types/theme";
import MessageInput from "./MessageInput";
import ReplyPreview from "./ReplyPreview";

interface ActiveChatComposerProps {
  chatId: string;
  composerScopeId: string;
  colors: AppColors;
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  handleUpdateChat: (message: Message) => void;
}

const ActiveChatComposer = ({
  chatId,
  composerScopeId,
  colors,
  setMessages,
  handleUpdateChat,
}: ActiveChatComposerProps) => {
  const {
    draftText,
    setDraftText,
    replyTo,
    setReplyTo,
    closeModal,
    handleFileInputChange,
  } = useComposer(composerScopeId);

  const { handleSend } = useMessageSender({
    chatId,
    replyTo,
    onReplyReset: () => setReplyTo(null),
    setMessages,
    handleUpdateChat,
    closeModal,
  });

  return (
    <>
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
    </>
  );
};

export default memo(ActiveChatComposer);
