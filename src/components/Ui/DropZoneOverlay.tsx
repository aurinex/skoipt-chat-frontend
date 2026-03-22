import React, { useState, useCallback } from "react";
import { Box, Typography, Fade } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import type { AppColors } from "../../types/theme";

interface DropZoneOverlayProps {
  children: React.ReactNode;
  onFilesDrop: (files: File[]) => void;
  colors: AppColors;
}

const DropZoneOverlay = ({
  children,
  onFilesDrop,
  colors,
}: DropZoneOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);

  // Чтобы оверлей не "мерцал" при наведении на дочерние элементы
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesDrop(files);
      }
    },
    [onFilesDrop],
  );

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        height: "100%",
        width: "100%",
      }}
    >
      {/* Оверлей подсказки */}
      <Fade in={isDragging}>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000, // Поверх всего
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            border: `3px dashed ${colors.eighth}`,
            borderRadius: "16px",
            m: 1,
            pointerEvents: "none", // Важно: чтобы не перехватывать события у контейнера
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 60, color: colors.eighth, mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
            Перетащите файлы сюда для отправки
          </Typography>
        </Box>
      </Fade>

      {children}
    </Box>
  );
};

export default DropZoneOverlay;
