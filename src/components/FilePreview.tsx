import { useEffect, useState } from "react";
import api from "../services/api";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const FilePreview = ({
  fileUrl,
  chatId,
}: {
  fileUrl: string;
  chatId: string;
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl.startsWith("http")) {
      setUrl(fileUrl); // публичный — сразу
    } else {
      // приватный — запрашиваем presigned URL
      api.files.getPrivateUrl(chatId, fileUrl).then((res) => setUrl(res.url));
    }
  }, [fileUrl]);

  if (!url) return <CircularProgress size={16} sx={{ mt: 1 }} />;

  const isImage =
    url.match(/\.(jpg|jpeg|png|gif|webp)/i) ||
    fileUrl.match(/\.(jpg|jpeg|png|gif|webp)/i);

  if (isImage) {
    return (
      <Box
        component="img"
        src={url}
        sx={{
          maxWidth: 280,
          maxHeight: 200,
          borderRadius: 2,
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
