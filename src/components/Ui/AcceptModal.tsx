import { Backdrop, Box, Button, Fade, Modal, Typography } from "@mui/material";
import type { AppColors } from "../../types/theme";

interface AcceptModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  colors: AppColors;
  onConfirm: () => void;
  onClose: () => void;
}

const AcceptModal = ({
  open,
  title = "Подтверждение",
  description = "Вы уверены?",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  loading = false,
  colors,
  onConfirm,
  onClose,
}: AcceptModalProps) => {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 180 } }}
      disableAutoFocus
      disableEnforceFocus
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            bgcolor: colors.second,
            color: colors.sixth,
            borderRadius: "24px",
            p: 3,
            boxShadow: "var(--surface-glow)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
            {title}
          </Typography>

          <Typography
            sx={{
              color: colors.fiveth,
              fontSize: 15,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 1,
            }}
          >
            <Button
              onClick={onClose}
              disabled={loading}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                px: 2,
                color: colors.sixth,
                bgcolor: colors.third,
              }}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                px: 2,
                color: "#fff",
                bgcolor: "#d94b4b",
                "&:hover": {
                  bgcolor: "#c53f3f",
                },
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.65)",
                  bgcolor: "rgba(217,75,75,0.55)",
                },
              }}
            >
              {loading ? "Удаление..." : confirmText}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AcceptModal;
