import { Box, IconButton, Typography, useTheme } from "@mui/material";
import type { Message } from "../../types";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  message: Message | null;
  onCancel: () => void;
}

const EditPreview = ({ message, onCancel }: Props) => {
  const theme = useTheme();
  const colors = theme.palette.background;

  if (!message) return null;

  return (
    <Box
      sx={{
        p: "8px 8px 8px 8px",
        bgcolor: colors.fourth,
        borderRadius: "24px",
        justifyContent: "space-between",
        display: "flex",
        alignItems: "center",
        mb: 1,
        animation: "softFadeUp var(--motion-base) var(--motion-spring)",
        boxShadow: "var(--surface-glow-soft)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 0.5,
        }}
      >
        <EditNoteRoundedIcon
          sx={{
            fontSize: 44,
            color: colors.fiveth,
            padding: "8px",
          }}
        />
        <Box>
          <Typography>Редактирование</Typography>
          <Typography variant="body2">{message.text}</Typography>
        </Box>
      </Box>
      <Box>
        <IconButton
          size="small"
          onClick={onCancel}
          sx={{ color: colors.fiveth }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default EditPreview;
