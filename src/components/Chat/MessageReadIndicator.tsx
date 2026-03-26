import { Box } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import type { Message } from "../../types";
import type { AppColors } from "../../types/theme";
import { hasMessageBeenRead } from "../../utils/messageRead";

interface MessageReadIndicatorProps {
  message?: Message | null;
  colors: AppColors;
  variant: "chat-list" | "message";
  pending?: boolean;
}

const MessageReadIndicator = ({
  message,
  colors,
  variant,
  pending = false,
}: MessageReadIndicatorProps) => {
  if (!message || message.is_system) return null;

  const isRead = hasMessageBeenRead(message);

  if (variant === "message") {
    if (!message.is_mine) return null;

    return (
      <DoneAllIcon
        sx={{
          fontSize: 14,
          color: pending
            ? "rgba(255,255,255,0.3)"
            : isRead
              ? "rgba(255,255,255,1)"
              : "rgba(255,255,255,0.5)",
        }}
      />
    );
  }

  if (message.is_mine) {
    return (
      <DoneAllIcon
        sx={{
          mr: "12px",
          fontSize: 18,
          color: isRead ? "#fff" : colors.eighth,
          transition:
            "color var(--motion-base) ease, transform var(--motion-fast) var(--motion-soft)",
          transform: isRead ? "scale(1.05)" : "scale(1)",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        mr: "17px",
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: isRead ? "#fff" : colors.eighth,
        boxShadow: isRead ? "none" : `0 0 0 6px ${colors.eighth}22`,
        transition: "all var(--motion-base) var(--motion-soft)",
      }}
    />
  );
};

export default MessageReadIndicator;
