import { useEffect, useMemo, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import api from "../../services/api";
import type { Attachment } from "../../types";
import {
  getAttachmentPreviewLike,
  getAttachmentTargetSource,
  isImageAttachment,
} from "../../utils/messageAttachments";

export interface ImageOpenPayload {
  attachment: Attachment;
  chatId: string;
}

interface FilePreviewProps {
  fileUrl?: string;
  attachment?: Attachment;
  chatId: string;
  onImageClick?: (payload: ImageOpenPayload) => void;
  grid?: boolean;
  variant?: "default" | "small";
}

const resolveDirectSource = (value: string) =>
  value.startsWith("http") || value.startsWith("blob:") ? value : null;

const FilePreview = ({
  fileUrl,
  attachment,
  chatId,
  grid = false,
  onImageClick,
  variant = "default",
}: FilePreviewProps) => {
  const displayRef = useMemo(() => {
    if (!attachment) return fileUrl ?? "";

    const previewLike = getAttachmentPreviewLike(attachment);
    return previewLike.url ?? previewLike.object_name ?? "";
  }, [attachment, fileUrl]);

  const targetRef = attachment ? getAttachmentTargetSource(attachment) : (fileUrl ?? "");
  const [displayUrl, setDisplayUrl] = useState<string | null>(
    resolveDirectSource(displayRef),
  );
  const [targetUrl, setTargetUrl] = useState<string | null>(
    resolveDirectSource(targetRef),
  );

  useEffect(() => {
    setDisplayUrl(resolveDirectSource(displayRef));
  }, [displayRef]);

  useEffect(() => {
    setTargetUrl(resolveDirectSource(targetRef));
  }, [targetRef]);

  useEffect(() => {
    if (!displayRef || displayUrl) return;

    let isActive = true;

    api.files.getPrivateUrl(chatId, displayRef).then((res) => {
      if (isActive) {
        setDisplayUrl(res.url);
      }
    });

    return () => {
      isActive = false;
    };
  }, [chatId, displayRef, displayUrl]);

  useEffect(() => {
    if (!targetRef || targetUrl) return;

    let isActive = true;

    api.files.getPrivateUrl(chatId, targetRef).then((res) => {
      if (isActive) {
        setTargetUrl(res.url);
      }
    });

    return () => {
      isActive = false;
    };
  }, [chatId, targetRef, targetUrl]);

  const isImage = attachment
    ? isImageAttachment(attachment)
    : /\.(jpg|jpeg|png|gif|webp)/i.test(targetRef);

  const effectiveDisplayUrl = displayUrl ?? targetUrl;
  if (!effectiveDisplayUrl) {
    return <CircularProgress size={16} sx={{ mt: 1 }} />;
  }

  const handleClick = (event: React.MouseEvent) => {
    if (isImage && attachment && onImageClick) {
      event.preventDefault();
      onImageClick({ attachment, chatId });
      return;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isImage) {
    if (variant === "small" && !grid) {
      return (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            minWidth: "200px",
            maxWidth: 300,
            borderRadius: "inherit",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={effectiveDisplayUrl}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(20px) brightness(0.6)",
              transform: "scale(1.2)",
            }}
          />

          <Box
            component="img"
            src={effectiveDisplayUrl}
            onClick={handleClick}
            sx={{
              position: "relative",
              zIndex: 1,
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
              maxHeight: 300,
              objectFit: "contain",
              cursor: "pointer",
              transition:
                "transform var(--motion-base) var(--motion-soft), filter var(--motion-base) var(--motion-soft)",
              "&:hover": {
                transform: "scale(1.02)",
                filter: "brightness(1.03)",
              },
            }}
          />
        </Box>
      );
    }

    return (
      <Box
        component="img"
        src={effectiveDisplayUrl}
        onClick={handleClick}
        sx={{
          width: grid ? "100%" : "auto",
          height: grid ? "100%" : "auto",
          maxWidth: grid ? "100%" : 320,
          maxHeight: grid ? "100%" : 200,
          objectFit: grid ? "cover" : "initial",
          borderRadius: grid ? "0px" : "10px 10px 0px 0px",
          display: "block",
          cursor: "pointer",
          transition:
            "opacity var(--motion-fast) var(--motion-soft), transform var(--motion-base) var(--motion-soft), filter var(--motion-fast) var(--motion-soft)",
          "&:hover": {
            opacity: 0.92,
            transform: "scale(1.015)",
            filter: "brightness(1.03)",
          },
        }}
      />
    );
  }

  return (
    <Box
      component="a"
      href={targetUrl ?? undefined}
      target="_blank"
      rel="noreferrer"
      sx={{
        display: "block",
        mt: 1,
        color: "inherit",
        textDecoration: "underline",
        fontSize: "0.85rem",
      }}
    >
      Открыть файл
    </Box>
  );
};

export default FilePreview;
export type { FilePreviewProps };
