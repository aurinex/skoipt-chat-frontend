import { useEffect, useState } from "react";
import api from "../services/api";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface FilePreviewProps {
  fileUrl: string;
  chatId: string;
  onImageClick?: (url: string) => void;
  grid?: boolean;
  variant?: "default" | "small";
}

const FilePreview = ({
  fileUrl,
  chatId,
  grid = false,
  onImageClick,
  variant = "default",
}: FilePreviewProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl.startsWith("http")) {
      setUrl(fileUrl);
    } else {
      api.files.getPrivateUrl(chatId, fileUrl).then((res) => setUrl(res.url));
    }
  }, [fileUrl, chatId]);

  if (!url) return <CircularProgress size={16} sx={{ mt: 1 }} />;

  const isImage =
    url.match(/\.(jpg|jpeg|png|gif|webp)/i) ||
    fileUrl.match(/\.(jpg|jpeg|png|gif|webp)/i);

  // Функция-обработчик клика
  const handleClick = (e: React.MouseEvent) => {
    if (isImage && onImageClick) {
      e.preventDefault();
      onImageClick(url); // Вместо открытия вкладки вызываем нашу модалку
    } else {
      window.open(url, "_blank");
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
          {/* 🔹 blur фон */}
          <Box
            component="img"
            src={url}
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

          {/* 🔹 основная картинка */}
          <Box
            component="img"
            src={url}
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
            }}
          />
        </Box>
      );
    }

    return (
      <Box
        component="img"
        src={url}
        onClick={handleClick}
        sx={{
          // Если grid=true, растягиваем на всю ячейку, иначе по старым размерам
          width: grid ? "100%" : "auto",
          height: grid ? "100%" : "auto",
          maxWidth: grid ? "100%" : 320,
          maxHeight: grid ? "100%" : 200,
          objectFit: grid ? "cover" : "initial",
          borderRadius: grid ? "0px" : "10px 10px 0px 0px",
          // mt: grid ? 0 : 1,
          display: "block",
          cursor: "pointer", // Иконка лупы для красоты
          transition: "opacity 0.2s",
          "&:hover": { opacity: 0.9 },
        }}
      />
    );
  }

  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      sx={{
        display: "block",
        mt: 1,
        color: "inherit",
        textDecoration: "underline",
        fontSize: "0.85rem",
      }}
    >
      📎 Открыть файл
    </Box>
  );
};

export default FilePreview;
