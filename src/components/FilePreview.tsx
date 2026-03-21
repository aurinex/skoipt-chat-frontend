import { useEffect, useState } from "react";
import api from "../services/api";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const FilePreview = ({
  fileUrl,
  chatId,
  grid = false,
  onImageClick, // Добавили пропс
}: {
  fileUrl: string;
  chatId: string;
  grid?: boolean;
  onImageClick?: (url: string) => void; // Описали тип
}) => {
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
