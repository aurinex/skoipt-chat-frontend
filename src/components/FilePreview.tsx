import { useEffect, useState } from "react";
import api from "../services/api";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const FilePreview = ({
  fileUrl,
  chatId,
  grid = false,
}: {
  fileUrl: string;
  chatId: string;
  grid?: boolean; // режим сетки — заполняет всю ячейку
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl.startsWith("http")) {
      setUrl(fileUrl);
    } else {
      api.files.getPrivateUrl(chatId, fileUrl).then((res) => setUrl(res.url));
    }
  }, [fileUrl]);

  if (!url) return <CircularProgress size={16} sx={{ mt: 1 }} />;

  const isImage =
    url.match(/\.(jpg|jpeg|png|gif|webp)/i) ||
    fileUrl.match(/\.(jpg|jpeg|png|gif|webp)/i);

  if (isImage) {
    if (grid) {
      // В режиме сетки — заполняем ячейку целиком
      return (
        <Box
          component="img"
          src={url}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            cursor: "pointer",
          }}
          onClick={() => window.open(url, "_blank")}
        />
      );
    }

    return (
      <Box
        component="img"
        src={url}
        sx={{
          maxWidth: 320,
          maxHeight: 200,
          borderRadius: "10px 10px 0px 0px",
          mt: 1,
          display: "block",
          cursor: "pointer",
        }}
        onClick={() => window.open(url, "_blank")}
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
