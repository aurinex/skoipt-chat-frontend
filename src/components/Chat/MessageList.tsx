import { useRef, useEffect, memo, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FilePreview from "../Ui/FilePreview";
import { formatLocalTime, formatDateLabel } from "../../utils/chatFormatters";
import type { Message, ChatData } from "../../types";

interface MessageListProps {
  messages: Message[];
  isMsgsLoading: boolean;
  chatData: ChatData | null;
  chatId: string | undefined;
  colors: any;
  onImageClick?: (url: string) => void;
  onReply?: (msg: Message) => void;
}

const MAX_HEIGHT = 1000;
const GAP = 16;
const SKELETON_TYPES = [
  { name: "text", height: 45 },
  { name: "long-text", height: 90 },
  { name: "image", height: 210 },
];

const SKELETON_ITEMS = (() => {
  let total = 0;
  const items: typeof SKELETON_TYPES = [];
  while (total < MAX_HEIGHT - 100) {
    const type =
      SKELETON_TYPES[Math.floor(Math.random() * SKELETON_TYPES.length)];
    if (total + type.height + GAP > MAX_HEIGHT) break;
    items.push(type);
    total += type.height + GAP;
  }
  return items;
})();

const MessageSkeleton = memo(({ colors }: { colors: any }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: `${GAP}px`,
      height: MAX_HEIGHT,
      overflow: "hidden",
      pt: 2,
    }}
  >
    {SKELETON_ITEMS.map((type, i) => {
      const isMe = i % 2 === 0;
      return (
        <Box
          key={i}
          sx={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            display: "flex",
            flexDirection: "column",
            alignItems: isMe ? "flex-end" : "flex-start",
            width: "45%",
          }}
        >
          {type.name === "image" ? (
            <Box
              sx={{
                p: 1,
                bgcolor: colors.skeleton,
                borderRadius: isMe
                  ? "20px 20px 5px 20px"
                  : "20px 20px 20px 5px",
                width: "100%",
                height: 190,
                opacity: 0.6,
              }}
            >
              <Skeleton
                variant="rounded"
                animation="wave"
                height={140}
                sx={{ bgcolor: colors.third, borderRadius: "15px", mb: 1 }}
              />
              <Skeleton
                variant="text"
                animation="wave"
                width="70%"
                sx={{ bgcolor: colors.third }}
              />
            </Box>
          ) : (
            <Skeleton
              variant="rounded"
              animation="wave"
              height={type.height}
              sx={{
                bgcolor: colors.skeleton,
                borderRadius: isMe
                  ? "20px 20px 5px 20px"
                  : "20px 20px 20px 5px",
                width: type.name === "text" ? "70%" : "100%",
              }}
            />
          )}
        </Box>
      );
    })}
  </Box>
));

// Сетка изображений — как в Telegram
const ImageGrid = ({
  urls,
  chatId,
  isUploading,
  onImageClick,
}: {
  urls: string[];
  chatId: string | undefined;
  isUploading?: boolean;
  onImageClick?: (url: string) => void;
}) => {
  const count = urls.length;

  if (count === 1) {
    return isUploading ? (
      <UploadingImageThumb src={urls[0]} />
    ) : (
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
        {/* 🔹 Blur фон */}
        <Box
          component="img"
          src={urls[0]}
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

        {/* 🔹 Основная картинка */}
        <FilePreview
          fileUrl={urls[0]}
          chatId={chatId!}
          onImageClick={onImageClick}
          variant="small"
        />
      </Box>
    );
  }

  // 2 колонки для 2+ изображений
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          count === 2 ? "1fr 1fr" : count === 3 ? "1fr 1fr" : "1fr 1fr",
        gap: "2px",
        borderRadius: "inherit",
        overflow: "hidden",
        maxWidth: 300,
      }}
    >
      {urls.map((url, i) => {
        // Для 3 фото: первое занимает всю первую колонку
        const isWide = count === 3 && i === 0;

        return (
          <Box
            key={i}
            sx={{
              gridColumn: isWide ? "1 / -1" : undefined,
              aspectRatio: isWide ? "2 / 1" : "1 / 1",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {isUploading ? (
              <UploadingImageThumb src={url} fill />
            ) : (
              <FilePreview
                fileUrl={url}
                chatId={chatId!}
                grid
                onImageClick={onImageClick}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Превью изображения из blob URL во время загрузки
const UploadingImageThumb = ({
  src,
  fill,
}: {
  src: string;
  fill?: boolean;
}) => (
  <Box
    component="img"
    src={src}
    sx={{
      width: "100%",
      height: fill ? "100%" : "auto",
      maxHeight: fill ? undefined : 200,
      objectFit: "cover",
      display: "block",
      filter: "brightness(0.7)",
    }}
  />
);

// Плейсхолдер для загружаемых файлов (не изображений)
const UploadingFilePlaceholder = ({
  count,
}: {
  count: number;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: "8px 12px",
          bgcolor: "rgba(255,255,255,0.1)",
          borderRadius: "10px",
        }}
      >
        <InsertDriveFileIcon sx={{ fontSize: 20, opacity: 0.6 }} />
        <LinearProgress
          sx={{
            flexGrow: 1,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": { bgcolor: "rgba(255,255,255,0.6)" },
          }}
        />
      </Box>
    ))}
  </Box>
);

const MessageList = memo(
  ({
    messages,
    isMsgsLoading,
    chatData,
    chatId,
    colors,
    onImageClick,
    onReply,
  }: MessageListProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevChatIdRef = useRef(chatId);
    const isChangingChat = prevChatIdRef.current !== chatId;
    if (isChangingChat) prevChatIdRef.current = chatId;

    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    useEffect(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, [messages]);

    const showSkeleton = isMsgsLoading || isChangingChat;

    return (
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {showSkeleton && messages.length === 0 ? (
          <MessageSkeleton colors={colors} />
        ) : (
          messages.map((msg, index) => {
            if (msg.is_system) {
              return (
                <Box
                  key={msg.id}
                  sx={{
                    alignSelf: "center",
                    my: 1,
                    px: 2,
                    py: 0.5,
                    bgcolor: colors.fourth,
                    borderRadius: "20px",
                  }}
                >
                  <Typography
                    sx={{
                      color: colors.fiveth,
                      fontSize: "0.75rem",
                      textAlign: "center",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.text}
                  </Typography>
                </Box>
              );
            }

            const isMessageFromMe = msg.is_mine;
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            const isFirstInGroup =
              !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const isLastInGroup =
              !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const currentDate = new Date(msg.created_at).toDateString();
            const prevDate = prevMsg
              ? new Date(prevMsg.created_at).toDateString()
              : null;
            const showDateLabel = currentDate !== prevDate;

            const fileUrls: string[] = msg.file_urls?.length
              ? msg.file_urls
              : msg.file_url
                ? [msg.file_url]
                : [];

            const isUploading = !!msg._uploading;

            // Разделяем на изображения и остальные файлы
            const imageUrls = fileUrls.filter(
              (u) =>
                u.match(/\.(jpg|jpeg|png|gif|webp)/i) || u.startsWith("blob:"),
            );
            const otherUrls = fileUrls.filter(
              (u) =>
                !u.match(/\.(jpg|jpeg|png|gif|webp)/i) &&
                !u.startsWith("blob:"),
            );

            // Для плейсхолдера не-изображений считаем количество
            const uploadingNonImageCount = isUploading
              ? (msg._nonImageCount ?? 0)
              : 0;

            const hasImages = imageUrls.length > 0;
            const hasText = !!msg.text;

            const isPureMedia = hasImages && !hasText && otherUrls.length === 0;

            return (
              <Box key={msg.id} sx={{ display: "contents" }}>
                {showDateLabel && (
                  <Box sx={{ alignSelf: "center", my: 2 }}>
                    <Typography
                      sx={{
                        color: colors.sixth,
                        fontSize: "14px",
                        p: "6px 25px",
                        borderRadius: "19px",
                        bgcolor: colors.second,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {formatDateLabel(msg.created_at)}
                    </Typography>
                  </Box>
                )}

                <Box
                  id={`msg-${msg.id}`}
                  onDoubleClick={() => onReply?.(msg)}
                  sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: isMessageFromMe ? "flex-end" : "flex-start",
                    gap: 1,
                    mb: isLastInGroup ? 2 : 0.4,
                  }}
                >
                  {!isMessageFromMe && (
                    <Box
                      sx={{
                        width: 45,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {isLastInGroup ? (
                        <Avatar
                          src={msg.sender?.avatar_url ?? undefined}
                          sx={{
                            width: 45,
                            height: 45,
                            fontSize: "1.2rem",
                            bgcolor: colors.eighth,
                          }}
                        >
                          {msg.sender?.first_name?.[0]}
                        </Avatar>
                      ) : (
                        <Box sx={{ width: 34 }} />
                      )}
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMessageFromMe ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                    }}
                  >
                    {!isMessageFromMe &&
                      (chatData?.member_count ?? 0) > 2 &&
                      isFirstInGroup && (
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            color: colors.eighth,
                            fontWeight: 600,
                            mb: 0.3,
                            ml: 1.5,
                          }}
                        >
                          {msg.sender?.first_name}{" "}
                          {msg.sender?.last_name?.[0]
                            ? `${msg.sender.last_name[0]}.`
                            : ""}
                        </Typography>
                      )}
                    {highlightedId === msg.id && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "16px",
                          zIndex: 0,
                          pointerEvents: "none",
                          ml: "54px",
                          background: `linear-gradient(
                            ${isMessageFromMe ? "270deg" : "90deg"},
                            ${colors.highlight} 0%,
                            ${colors.third} 90%
                          )`,
                          animation: "fadeHighlight 2s ease forwards",
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        position: "relative",
                        zIndex: 1,
                        p: isPureMedia ? 0 : 0,
                        borderRadius: isMessageFromMe
                          ? isLastInGroup
                            ? "18px 18px 4px 18px"
                            : "18px"
                          : isLastInGroup
                            ? "18px 18px 18px 4px"
                            : "18px",
                        bgcolor: isMessageFromMe
                          ? colors.eighth
                          : colors.second,
                        color: isMessageFromMe ? "#fff" : colors.sixth,
                        overflow: "hidden", // Чтобы картинки не вылезали за скругления
                        display: "flex",
                        flexDirection: "column",
                        width: "fit-content", // Добавляем это
                        alignSelf: isMessageFromMe ? "flex-end" : "flex-start", // Важно для выравнивания
                        maxWidth: "100%", // Чтобы не вылезало за экран
                      }}
                    >
                      {/* КАРТИНКИ */}
                      {hasImages && (
                        <Box
                          sx={{
                            width: "100%",
                            // Если сверху есть текст, убираем верхние скругления у картинок
                            "& img, & .grid-container": {
                              borderTopLeftRadius: hasText ? 0 : "inherit",
                              borderTopRightRadius: hasText ? 0 : "inherit",
                            },
                          }}
                        >
                          <ImageGrid
                            urls={imageUrls}
                            chatId={chatId}
                            isUploading={isUploading}
                            onImageClick={onImageClick}
                          />
                        </Box>
                      )}

                      {msg.reply_to_message && (
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();

                            const targetId = msg.reply_to;
                            const el = document.getElementById(
                              `msg-${targetId}`,
                            );

                            if (el) {
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });

                              setHighlightedId(targetId);

                              setTimeout(() => {
                                setHighlightedId(null);
                              }, 2000);
                            }
                          }}
                          sx={{
                            px: 1.5,
                            py: 1,
                            // borderLeft: `3px solid ${colors.eighth}`,
                            bgcolor: "rgba(255, 255, 255, 0.12)",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "0.75rem", color: "#fff" }}
                          >
                            {msg.reply_to_message.sender?.first_name || "Ответ"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: "#cdcdcdff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {msg.reply_to_message.text || "Файл"}
                          </Typography>
                        </Box>
                      )}

                      {/* ТЕКСТ */}
                      {hasText && (
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                            p: "8px 14px 6px 14px",
                            maxWidth: hasImages ? "220px" : "100%",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {msg.text}
                        </Typography>
                      )}

                      {/* ФАЙЛЫ */}
                      <Box sx={{ p: otherUrls.length > 0 ? "4px 12px" : 0 }}>
                        {!isUploading &&
                          otherUrls.map((url, i) => (
                            <FilePreview
                              key={i}
                              fileUrl={url}
                              chatId={chatId!}
                              onImageClick={onImageClick}
                            />
                          ))}
                      </Box>
                      {/* Плейсхолдер для загружаемых не-изображений */}
                      {isUploading && uploadingNonImageCount > 0 && (
                        <UploadingFilePlaceholder
                          count={uploadingNonImageCount}
                        />
                      )}

                      {/* Индикатор загрузки поверх сетки */}
                      {/* {isUploading && hasImages && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <CircularProgress size={32} sx={{ color: "#fff" }} />
                        </Box>
                      )} */}

                      {/* МЕТАДАННЫЕ */}
                      <Box
                        className="image-metadata"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                          pt: 0.5,
                          ...(isPureMedia
                            ? {
                                position: "absolute",
                                bottom: "6px",
                                right: "6px",
                                bgcolor: "rgba(0,0,0,0.4)",
                                borderRadius: "12px",
                                px: "8px",
                                py: "2px",
                                color: "#fff",
                                zIndex: 10,
                              }
                            : {
                                // Если есть текст, время идет снизу в потоке
                                mt: -1.5, // Немного приподнимаем, если оно внизу текста/картинки
                                alignSelf: "flex-end",
                                px: "12px",
                                pb: "6px",
                                pointerEvents: "none",
                              }),
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            opacity: isPureMedia ? 0.9 : 0.5,
                          }}
                        >
                          {formatLocalTime(msg.created_at)}
                        </Typography>

                        {isMessageFromMe && (
                          <>
                            {msg._failed ? (
                              <Tooltip
                                title="Не отправлено. Попробуйте снова."
                                placement="top"
                              >
                                <ErrorOutlineIcon
                                  sx={{
                                    fontSize: 14,
                                    color: "#ff4d4f",
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <DoneAllIcon
                                sx={{
                                  fontSize: 14,
                                  color:
                                    msg._pending || isUploading
                                      ? "rgba(255,255,255,0.3)"
                                      : msg.read_by?.length > 0
                                        ? "rgba(255,255,255,1)"
                                        : "rgba(255,255,255,0.5)",
                                }}
                              />
                            )}
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    );
  },
);

export default MessageList;
