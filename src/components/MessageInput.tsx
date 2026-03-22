import { useRef, useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import { socket } from "../services/api";

interface MessageInputProps {
  chatId: string | undefined;
  onSend: (text: string, replyToId?: string) => void;
  replyTo?: any;
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
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      } as any);

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
        <AttachFileIcon />
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
        <MicIcon />
      </IconButton>
      <IconButton sx={{ color: colors.eighth }} onClick={handleSend}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
