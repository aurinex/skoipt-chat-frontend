import { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";

interface FileUploadModalProps {
  open: boolean;
  files: File[];
  onClose: () => void;
  onSend: (files: File[], caption: string) => void;
  onAddMore: (newFiles: File[]) => void;
  onRemove: (index: number) => void;
  colors: any;
}

const MAX_FILES = 10;

const getFilePreview = (file: File): string | null => {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    return URL.createObjectURL(file);
  }
  return null;
};

const FileThumb = ({
  file,
  index,
  isSelected,
  onSelect,
  onRemove,
  colors,
}: {
  file: File;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  colors: any;
}) => {
  const preview = getFilePreview(file);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  return (
    <Box
      onClick={onSelect}
      sx={{
        position: "relative",
        width: 64,
        height: 64,
        borderRadius: "10px",
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        border: isSelected
          ? `2px solid ${colors.eighth}`
          : "2px solid transparent",
        transition: "border 0.15s",
      }}
    >
      {preview && isImage ? (
        <Box
          component="img"
          src={preview}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : preview && isVideo ? (
        <Box
          component="video"
          src={preview}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: colors.fourth,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 0.3,
          }}
        >
          {isAudio ? (
            <AudioFileIcon sx={{ fontSize: 24, color: colors.eighth }} />
          ) : (
            <InsertDriveFileIcon sx={{ fontSize: 24, color: colors.eighth }} />
          )}
          <Typography
            sx={{
              fontSize: "0.55rem",
              color: colors.fiveth,
              px: 0.5,
              textAlign: "center",
              lineHeight: 1.2,
            }}
            noWrap
          >
            {file.name.split(".").pop()?.toUpperCase()}
          </Typography>
        </Box>
      )}

      {/* Крестик удаления */}
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
        }}
      >
        <CloseIcon sx={{ fontSize: 12, color: "#fff" }} />
      </Box>
    </Box>
  );
};

const FileUploadModal = ({
  open,
  files,
  onClose,
  onSend,
  onAddMore,
  onRemove,
  colors,
}: FileUploadModalProps) => {
  const [caption, setCaption] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[selectedIndex] ?? files[0];
  const selectedPreview = selectedFile ? getFilePreview(selectedFile) : null;
  const isSelectedImage = selectedFile?.type.startsWith("image/");
  const isSelectedVideo = selectedFile?.type.startsWith("video/");
  const isSelectedAudio = selectedFile?.type.startsWith("audio/");

  const handleSend = useCallback(() => {
    if (!files.length) return;
    onSend(files, caption);
    setCaption("");
  }, [files, caption, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    onAddMore(newFiles);
    e.target.value = "";
  };

  // Корректируем selectedIndex если файл удалён
  const safeIndex = Math.min(selectedIndex, files.length - 1);
  if (safeIndex !== selectedIndex) setSelectedIndex(safeIndex);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200 } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95vw", sm: 480 },
            maxHeight: "90vh",
            bgcolor: colors.second,
            borderRadius: "20px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Шапка */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: "16px 20px 12px",
            }}
          >
            <Typography
              sx={{ fontWeight: 600, color: colors.sixth, fontSize: "1rem" }}
            >
              Отправить файлы
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "0.8rem", color: colors.fiveth }}>
                {files.length} / {MAX_FILES}
              </Typography>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: colors.fiveth }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Превью выбранного файла */}
          <Box
            sx={{
              mx: 2,
              borderRadius: "14px",
              overflow: "hidden",
              bgcolor: colors.third,
              minHeight: 200,
              maxHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedPreview && isSelectedImage && (
              <Box
                component="img"
                src={selectedPreview}
                sx={{
                  maxWidth: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            )}
            {selectedPreview && isSelectedVideo && (
              <Box
                component="video"
                src={selectedPreview}
                controls
                sx={{ maxWidth: "100%", maxHeight: 320, display: "block" }}
              />
            )}
            {isSelectedAudio && (
              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AudioFileIcon sx={{ fontSize: 48, color: colors.eighth }} />
                <Typography
                  sx={{
                    color: colors.sixth,
                    fontSize: "0.9rem",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedFile?.name}
                </Typography>
              </Box>
            )}
            {!selectedPreview && !isSelectedAudio && selectedFile && (
              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: 48, color: colors.eighth }}
                />
                <Typography
                  sx={{
                    color: colors.sixth,
                    fontSize: "0.9rem",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedFile?.name}
                </Typography>
                <Typography sx={{ color: colors.fiveth, fontSize: "0.75rem" }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Box>

          {/* Полоска миниатюр */}
          {files.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                px: 2,
                pt: 1.5,
                pb: 0.5,
                overflowX: "auto",
                alignItems: "center",
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: colors.fourth,
                  borderRadius: 2,
                },
              }}
            >
              {files.map((file, i) => (
                <FileThumb
                  key={i}
                  file={file}
                  index={i}
                  isSelected={i === safeIndex}
                  onSelect={() => setSelectedIndex(i)}
                  onRemove={() => onRemove(i)}
                  colors={colors}
                />
              ))}

              {/* Кнопка добавить ещё */}
              {files.length < MAX_FILES && (
                <Box
                  onClick={() => addMoreRef.current?.click()}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "10px",
                    border: `2px dashed ${colors.fiveth}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    "&:hover": { borderColor: colors.eighth },
                  }}
                >
                  <AddIcon sx={{ color: colors.fiveth }} />
                </Box>
              )}
              <input
                ref={addMoreRef}
                type="file"
                hidden
                multiple
                accept="image/*,video/mp4,audio/*,application/pdf"
                onChange={handleAddMore}
              />
            </Box>
          )}

          {/* Caption + кнопка отправить */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: "12px 16px 16px",
            }}
          >
            <TextField
              fullWidth
              placeholder="Добавить подпись..."
              variant="standard"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline
              maxRows={3}
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: colors.sixth,
                  bgcolor: colors.fourth,
                  borderRadius: "20px",
                  px: 2,
                  py: 1,
                  fontSize: "0.95rem",
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              sx={{
                bgcolor: colors.eighth,
                color: "#fff",
                width: 44,
                height: 44,
                flexShrink: 0,
                "&:hover": { bgcolor: colors.eighth, opacity: 0.85 },
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default FileUploadModal;
