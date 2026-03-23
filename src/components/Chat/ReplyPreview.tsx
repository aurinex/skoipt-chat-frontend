import { Box, Typography, IconButton } from "@mui/material";
import type { Message } from "../../types";
import type { AppColors } from "../../types/theme";

interface ReplyPreviewProps {
  replyTo: Message | null;
  onCancel?: () => void;
  colors: AppColors;
}

const ReplyPreview = ({ replyTo, onCancel, colors }: ReplyPreviewProps) => {
  if (!replyTo) return null;

  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.5,
        mb: 1,
        bgcolor: colors.second,
        borderLeft: `3px solid ${colors.eighth}`,
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box sx={{ overflow: "hidden" }}>
        <Typography sx={{ fontSize: "0.75rem", color: colors.fiveth }}>
          {replyTo.sender?.first_name || "Ответ"}
        </Typography>

        <Typography
          sx={{
            fontSize: "0.85rem",
            color: colors.sixth,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 1200,
          }}
        >
          {replyTo.text || "Файл"}
        </Typography>
      </Box>

      <IconButton size="small" onClick={onCancel}>
        ✕
      </IconButton>
    </Box>
  );
};

export default ReplyPreview;
