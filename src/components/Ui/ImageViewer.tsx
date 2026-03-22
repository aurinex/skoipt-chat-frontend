import { Modal, Box, IconButton, Fade, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ImageViewerProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
}

const ImageViewer = ({ open, src, onClose }: ImageViewerProps) => {
  if (!src) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 300, sx: { bgcolor: "rgba(0,0,0,0.9)" } },
      }}
    >
      <Fade in={open}>
        <Box
          onClick={onClose} // Закрытие при клике на любое место
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
            p: 2,
            cursor: "pointer",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            component="img"
            src={src}
            onClick={(e) => e.stopPropagation()} // Чтобы клик по самому фото не закрывал его
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default ImageViewer;
