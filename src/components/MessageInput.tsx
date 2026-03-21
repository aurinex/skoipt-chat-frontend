import { useRef } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import { socket } from "../services/api";

interface MessageInputProps {
  chatId: string | undefined;
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colors: any;
}

const MessageInput = ({
  chatId,
  onSend,
  onFileUpload,
  colors,
}: MessageInputProps) => {
  const [inputText, setInputText] = useState(""); // ← стейт живёт здесь
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    if (!chatId) return;

    if (!myTypingTimerRef.current) {
      socket.sendTyping(chatId, true);
    }
    if (myTypingTimerRef.current) clearTimeout(myTypingTimerRef.current);

    myTypingTimerRef.current = setTimeout(() => {
      socket.sendTyping(chatId, false);
      myTypingTimerRef.current = null;
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSend(inputText); // ← передаём текст наружу только при отправке
    setInputText("");
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    socket.sendTyping(chatId, false);
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
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          disableUnderline: true,
          sx: { color: colors.sixth, px: 1 },
        }}
      />
      <IconButton sx={{ color: colors.fiveth }}>
        <MicIcon />
      </IconButton>
      <IconButton sx={{ color: colors.eighth }} onClick={onSend}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
