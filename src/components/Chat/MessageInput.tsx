import { useRef } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import { socket } from "../../services/api";

import FileCustomIcon from "../../assets/icons/file.svg?react";
import MicCustomIcon from "../../assets/icons/micro.svg?react";
import SendCustomIcon from "../../assets/icons/send.svg?react";
import type { Message } from "../../types";

interface MessageInputProps {
  chatId: string | undefined;
  onSend: (text: string, replyToId?: string) => void;
  replyTo?: Message | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  onChange: (text: string) => void;
  colors: any;
}

const MessageInput = ({
  chatId,
  onSend,
  onFileUpload,
  value,
  onChange,
  colors,
  replyTo,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    onChange(value);
    if (!chatId) return;

    if (!myTypingTimerRef.current) {
      socket.sendTyping(chatId, true);
    }
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
    }
    myTypingTimerRef.current = setTimeout(() => {
      socket.sendTyping(chatId, false);
      myTypingTimerRef.current = null;
    }, 2000);
  };

  const handleSend = () => {
    if (!value.trim()) return;

    onSend(value, replyTo?.id);
    onChange(""); // ✅ очистка

    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }

    if (chatId) socket.sendTyping(chatId, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ❗ блокируем перенос
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault(); // ❗ важно

      onFileUpload({
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>);

      return;
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 1,
        bgcolor: colors.fourth,
        borderRadius: "25px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="image/*,video/mp4,audio/*,application/pdf"
        onChange={onFileUpload}
      />
      <IconButton
        sx={{ color: colors.fiveth }}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileCustomIcon width={24} height={24} />
      </IconButton>
      <TextField
        multiline
        maxRows={6}
        fullWidth
        placeholder="Сообщение"
        variant="standard"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        InputProps={{
          disableUnderline: true,
          sx: { color: colors.sixth, px: 1 },
        }}
      />
      <IconButton sx={{ color: colors.fiveth }}>
        <MicCustomIcon width={24} height={24} />
      </IconButton>
      <IconButton sx={{ color: colors.wb }} onClick={handleSend}>
        <SendCustomIcon width={24} height={24} />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
