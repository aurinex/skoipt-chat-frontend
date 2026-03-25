import { useEffect, useRef } from "react";
import { Box, TextField, IconButton, useTheme } from "@mui/material";
import { socket } from "../../services/api";
import { useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotionsRounded";

import FileCustomIcon from "../../assets/icons/file.svg?react";
import MicCustomIcon from "../../assets/icons/micro.svg?react";
import SendCustomIcon from "../../assets/icons/send.svg?react";
import type { Message } from "../../types";
import type { AppColors } from "../../types/theme";

interface MessageInputProps {
  chatId: string | undefined;
  onSend: (text: string, replyToId?: string) => void;
  replyTo?: Message | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  onChange: (text: string) => void;
  colors: AppColors;
  onEditLastMessage?: () => void;
  onCancelEdit?: () => void;
  editing?: boolean;
}

const MessageInput = ({
  chatId,
  onSend,
  onFileUpload,
  value,
  onChange,
  colors,
  replyTo,
  onEditLastMessage,
  onCancelEdit,
  editing,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const muiTheme = useTheme();
  const emojiTheme =
    muiTheme.palette.mode === "dark" ? Theme.DARK : Theme.LIGHT;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowEmoji(false);
      }
    };

    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmoji]);

  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

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
    if (e.key === "ArrowUp" && !value) {
      e.preventDefault();
      onEditLastMessage?.();
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit?.();
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
        position: "relative",
        boxShadow: "var(--surface-glow-soft)",
        transition:
          "transform var(--motion-fast) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft), background-color var(--motion-base) var(--motion-soft)",
        "&:focus-within": {
          transform: "translateY(-2px)",
          boxShadow: "var(--surface-glow)",
        },
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
      {showEmoji && (
        <Box
          ref={pickerRef}
          sx={{
            position: "absolute",
            bottom: 70,
            right: 0,
            zIndex: 10,
            transformOrigin: "bottom right",
            animation: "softFadeUp var(--motion-base) var(--motion-spring)",
          }}
        >
          <EmojiPicker
            searchDisabled={true}
            theme={emojiTheme}
            onEmojiClick={(emojiData) => {
              onChange(value + emojiData.emoji);
            }}
          />
        </Box>
      )}
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
        inputRef={inputRef}
        InputProps={{
          disableUnderline: true,
          sx: {
            color: colors.sixth,
            px: 1,
            "& textarea": {
              lineHeight: 1.45,
            },
          },
        }}
      />
      <IconButton
        ref={buttonRef}
        sx={{
          transition:
            "transform var(--motion-fast) var(--motion-soft), color var(--motion-fast) var(--motion-soft)",
          transform: showEmoji ? "scale(1.06)" : "scale(1)",
          color: showEmoji ? colors.eighth : colors.fiveth,
        }}
        onClick={() => {
          setShowEmoji((prev) => !prev);
        }}
      >
        <EmojiEmotionsIcon />
      </IconButton>
      <IconButton sx={{ color: colors.fiveth }}>
        <MicCustomIcon width={24} height={24} />
      </IconButton>
      <IconButton
        sx={{
          color: colors.wb,
          transition:
            "transform var(--motion-fast) var(--motion-soft), filter var(--motion-fast) var(--motion-soft)",
          "&:hover": {
            transform: "translateX(1px) scale(1.05)",
            filter: "brightness(1.08)",
          },
        }}
        onClick={handleSend}
      >
        <SendCustomIcon width={24} height={24} />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
