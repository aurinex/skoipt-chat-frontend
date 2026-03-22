import { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Modal,
  Fade,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface FileUploadModalProps {
  open: boolean;
  files: File[];
  onClose: () => void;
  onSend: (files: File[], caption: string) => Promise<void>;
  onAddMore: (newFiles: File[]) => void;
  onRemove: (index: number) => void;
  colors: any;
  initialCaption?: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "audio/m4a",
  "application/pdf",
]);

interface ValidationError {
  file: string;
  reason: string;
}

// Валидирует массив файлов, возвращает валидные и список ошибок
const validateFiles = (
  files: File[],
): { valid: File[]; errors: ValidationError[] } => {
  const valid: File[] = [];
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push({ file: file.name, reason: "неподдерживаемый формат" });
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        file: file.name,
        reason: `превышен лимит 50 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ)`,
      });
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
};

const useBlobUrl = (file: File | null): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return url;
};

const FileThumb = ({
  file,
  isSelected,
  hasError,
  onSelect,
  onRemove,
  disabled,
  colors,
}: {
  file: File;
  isSelected: boolean;
  hasError: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled: boolean;
  colors: any;
}) => {
  const preview = useBlobUrl(file);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  return (
    <Box
      onClick={disabled ? undefined : onSelect}
      sx={{
        position: "relative",
        width: 64,
        height: 64,
        borderRadius: "10px",
        overflow: "hidden",
        flexShrink: 0,
        cursor: disabled ? "default" : "pointer",
        border: hasError
          ? "2px solid #ff4d4f"
          : isSelected
            ? `2px solid ${colors.eighth}`
            : "2px solid transparent",
        transition: "border 0.15s",
        opacity: disabled ? 0.5 : 1,
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
            <AudioFileIcon
              sx={{ fontSize: 24, color: hasError ? "#ff4d4f" : colors.eighth }}
            />
          ) : (
            <InsertDriveFileIcon
              sx={{ fontSize: 24, color: hasError ? "#ff4d4f" : colors.eighth }}
            />
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

      {/* Иконка ошибки поверх миниатюры */}
      {hasError && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 24, color: "#ff4d4f" }} />
        </Box>
      )}

      {!disabled && (
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
      )}
    </Box>
  );
};

const SelectedFilePreview = ({
  file,
  colors,
}: {
  file: File | null;
  colors: any;
}) => {
  const preview = useBlobUrl(file);
  const isImage = file?.type.startsWith("image/");
  const isVideo = file?.type.startsWith("video/");
  const isAudio = file?.type.startsWith("audio/");

  if (!file) return null;

  return (
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
      {preview && isImage && (
        <Box
          component="img"
          src={preview}
          sx={{
            maxWidth: "100%",
            maxHeight: 320,
            objectFit: "contain",
            display: "block",
          }}
        />
      )}
      {preview && isVideo && (
        <Box
          component="video"
          src={preview}
          controls
          sx={{ maxWidth: "100%", maxHeight: 320, display: "block" }}
        />
      )}
      {isAudio && (
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
            {file.name}
          </Typography>
        </Box>
      )}
      {!preview && !isAudio && (
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 48, color: colors.eighth }} />
          <Typography
            sx={{
              color: colors.sixth,
              fontSize: "0.9rem",
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            {file.name}
          </Typography>
          <Typography sx={{ color: colors.fiveth, fontSize: "0.75rem" }}>
            {(file.size / 1024 / 1024).toFixed(2)} МБ
          </Typography>
        </Box>
      )}
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
  initialCaption = "",
}: FileUploadModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [caption, setCaption] = useState(initialCaption || "");
  const addMoreRef = useRef<HTMLInputElement>(null);

  const safeIndex =
    files.length > 0 ? Math.min(selectedIndex, files.length - 1) : 0;
  const selectedFile = files[safeIndex] ?? null;

  // Индексы файлов с ошибками валидации (для подсветки миниатюр)
  const errorFileNames = new Set(validationErrors.map((e) => e.file));
  const invalidFileIndices = new Set(
    files
      .map((f, i) => (errorFileNames.has(f.name) ? i : -1))
      .filter((i) => i !== -1),
  );

  // Валидные файлы для отправки
  const validFiles = files.filter((f) => !errorFileNames.has(f.name));
  const hasInvalidFiles = invalidFileIndices.size > 0;
  const canSend = validFiles.length > 0 && !isSending;

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      // даём модалке отрендериться
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setCaption(initialCaption || "");
    }
  }, [open, initialCaption]);

  useEffect(() => {
    if (safeIndex !== selectedIndex) setSelectedIndex(safeIndex);
  }, [safeIndex]);

  useEffect(() => {
    if (!open) {
      setCaption("");
      setIsSending(false);
      setValidationErrors([]);
    }
  }, [open]);

  // Валидируем при каждом изменении списка файлов
  useEffect(() => {
    const { errors } = validateFiles(files);
    setValidationErrors(errors);
  }, [files]);

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    onAddMore(newFiles);
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setIsSending(true);
    try {
      await onSend(validFiles, caption);
    } catch {
      setIsSending(false);
    }
  }, [canSend, validFiles, caption, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal
      open={open}
      onClose={isSending ? undefined : onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200 } }}
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
              {isSending ? "Отправка..." : "Отправить файлы"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "0.8rem", color: colors.fiveth }}>
                {files.length} / {MAX_FILES}
              </Typography>
              <IconButton
                size="small"
                onClick={onClose}
                disabled={isSending}
                sx={{ color: colors.fiveth }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Блок ошибок валидации */}
          {validationErrors.length > 0 && !isSending && (
            <Box
              sx={{
                mx: 2,
                mb: 1,
                p: "10px 14px",
                bgcolor: "rgba(255,77,79,0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(255,77,79,0.3)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#ff4d4f",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                {validationErrors.length === 1
                  ? "Файл не будет отправлен:"
                  : "Файлы не будут отправлены:"}
              </Typography>
              {validationErrors.map((err, i) => (
                <Typography
                  key={i}
                  sx={{ fontSize: "0.72rem", color: "#ff7875" }}
                  noWrap
                >
                  • {err.file} — {err.reason}
                </Typography>
              ))}
            </Box>
          )}

          {/* Превью */}
          <SelectedFilePreview file={selectedFile} colors={colors} />

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
                  key={`${file.name}-${file.size}-${i}`}
                  file={file}
                  isSelected={i === safeIndex}
                  hasError={invalidFileIndices.has(i)}
                  onSelect={() => setSelectedIndex(i)}
                  onRemove={() => onRemove(i)}
                  disabled={isSending}
                  colors={colors}
                />
              ))}

              {files.length < MAX_FILES && !isSending && (
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

          {/* Caption + кнопка */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: "12px 16px 16px",
            }}
          >
            <TextField
              inputRef={inputRef}
              onPaste={(e) => {
                inputRef.current?.focus();
              }}
              fullWidth
              placeholder={
                hasInvalidFiles && validFiles.length > 0
                  ? `Отправить ${validFiles.length} из ${files.length} файлов...`
                  : "Добавить подпись..."
              }
              variant="standard"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline
              maxRows={3}
              disabled={isSending}
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: colors.sixth,
                  bgcolor: colors.fourth,
                  borderRadius: "20px",
                  px: 2,
                  py: 1,
                  fontSize: "0.95rem",
                  opacity: isSending ? 0.5 : 1,
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!canSend}
              sx={{
                bgcolor: colors.eighth,
                color: "#fff",
                width: 44,
                height: 44,
                flexShrink: 0,
                "&:hover": { bgcolor: colors.eighth, opacity: 0.85 },
                "&.Mui-disabled": {
                  bgcolor: colors.eighth,
                  opacity: 0.5,
                  color: "#fff",
                },
              }}
            >
              {isSending ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                <SendIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default FileUploadModal;
