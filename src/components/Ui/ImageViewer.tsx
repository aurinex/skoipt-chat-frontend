import { useEffect, useState } from "react";
import { Modal, Box, IconButton, Fade, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../../services/api";
import type { Attachment } from "../../types";
import { getAttachmentTargetSource } from "../../utils/messageAttachments";

interface ImageViewerProps {
  open: boolean;
  attachment: Attachment | null;
  chatId?: string | null;
  onClose: () => void;
}

const ImageViewer = ({ open, attachment, chatId, onClose }: ImageViewerProps) => {
  const source = attachment ? getAttachmentTargetSource(attachment) : "";
  const directUrl =
    source.startsWith("http") || source.startsWith("blob:") ? source : null;
  const [resolvedImage, setResolvedImage] = useState<{
    source: string;
    url: string;
  } | null>(null);
  const imageUrl =
    directUrl ??
    (resolvedImage?.source === source ? resolvedImage.url : null);

  useEffect(() => {
    if (!attachment || directUrl || !chatId) {
      return;
    }

    let isActive = true;

    api.files.getPrivateUrl(chatId, source).then((res) => {
      if (isActive) {
        setResolvedImage({ source, url: res.url });
      }
    });

    return () => {
      isActive = false;
    };
  }, [attachment, chatId, directUrl, source]);

  if (!attachment) return null;

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
          onClick={onClose}
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

          {imageUrl && (
            <IconButton
              component="a"
              href={imageUrl}
              download={attachment.filename ?? undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              sx={{
                position: "absolute",
                top: 20,
                right: 72,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <DownloadRoundedIcon />
            </IconButton>
          )}

          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              onClick={(event) => event.stopPropagation()}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                cursor: "default",
              }}
            />
          ) : (
            <CircularProgress sx={{ color: "#fff" }} />
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default ImageViewer;
