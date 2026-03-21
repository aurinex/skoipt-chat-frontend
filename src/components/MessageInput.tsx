import { useRef, useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import { socket } from "../services/api";

interface MessageInputProps {
  chatId: string | undefined;
  onSend: (text: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colors: any;
}

const MessageInput = ({
  chatId,
  onSend,
  onFileUpload,
  colors,
}: MessageInputProps) => {
  const [inputText, setInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
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
    if (!inputText.trim()) return;
    onSend(inputText);
    setInputText("");
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    if (chatId) socket.sendTyping(chatId, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
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
        fullWidth
        placeholder="Сообщение"
        variant="standard"
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
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
