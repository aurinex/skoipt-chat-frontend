import {
  useRef,
  useEffect,
  useLayoutEffect,
  memo,
  useMemo,
  useState,
  useCallback,
  type RefObject,
} from "react";
import {
  Box,
  Typography,
  Skeleton,
  Tooltip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import emojiRegex from "emoji-regex";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import FilePreview from "../Ui/FilePreview";
import type { ImageOpenPayload } from "../Ui/FilePreview";
import { getChatDateKey } from "../../utils/chatFormatters";
import api from "../../services/api";
import type { Attachment, Message, ChatData } from "../../types";
import type { AppColors } from "../../types/theme";
import { useUserStore } from "../../stores/useUserStore";
import { resolveUser } from "../../utils/user";
import UserAvatar from "../Ui/UserAvatar";
import UserName from "../Ui/UserName";
import DateLabel from "../Ui/DateLabel";
import TimeText from "../Ui/TimeText";
import MessageReadIndicator from "./MessageReadIndicator";
import {
  getAttachmentSource,
  inferMessageType,
  splitMessageAttachments,
} from "../../utils/messageAttachments";

interface MessageListProps {
  messages: Message[];
  isMsgsLoading: boolean;
  chatData: ChatData | null;
  chatId: string | undefined;
  colors: AppColors;
  onImageClick?: (payload: ImageOpenPayload) => void;
  onReply?: (msg: Message) => void;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  onContextMenuOpen?: (data: {
    mouseX: number;
    mouseY: number;
    message: Message | null;
  }) => void;
  onLoadNewer?: () => void;
  canLoadNewer?: boolean;
  isLoadingNewer?: boolean;
  jumpToMessageId?: string | null;
  onJumpHandled?: () => void;
  onJumpToMessage?: (messageId: string) => void | Promise<void>;
  onScrollToLatest?: () => void | Promise<void>;
}

interface MessageRowProps {
  msg: Message;
  prevMsg?: Message;
  nextMsg?: Message;
  showDateLabel: boolean;
  isGroupChat: boolean;
  chatId: string | undefined;
  colors: AppColors;
  usersById: ReturnType<typeof useUserStore.getState>["usersById"];
  highlighted: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onImageClick?: (payload: ImageOpenPayload) => void;
  onReply?: (msg: Message) => void;
  onContextMenuOpen?: (data: {
    mouseX: number;
    mouseY: number;
    message: Message | null;
  }) => void;
  onHighlightMessage: (id: string) => void;
  onJumpToMessage?: (messageId: string) => void | Promise<void>;
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

const scrollMessageIntoView = (
  container: HTMLDivElement,
  messageId: string,
  behavior: ScrollBehavior = "smooth",
) => {
  const el = document.getElementById(`msg-${messageId}`);
  if (!el) return false;

  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offset = elRect.top - containerRect.top + container.scrollTop;

  container.scrollTo({
    top: offset - container.clientHeight / 2 + el.clientHeight / 2,
    behavior,
  });

  return true;
};

const VIRTUAL_OVERSCAN_PX = 1200;

const estimateMessageEntryHeight = (message: Message, showDateLabel: boolean) => {
  const messageType = inferMessageType(message);
  const { imageAttachments, voiceAttachments, fileAttachments } =
    splitMessageAttachments(message);

  let estimatedHeight = 92;

  if (showDateLabel) {
    estimatedHeight += 56;
  }

  if (messageType === "system") {
    return estimatedHeight + 36;
  }

  if (imageAttachments.length > 0) {
    estimatedHeight += imageAttachments.length === 1 ? 260 : 220;
  }

  if (voiceAttachments.length > 0) {
    estimatedHeight += 92;
  }

  if (fileAttachments.length > 0) {
    estimatedHeight += Math.min(fileAttachments.length, 3) * 44;
  }

  if (message.reply_to_message) {
    estimatedHeight += 56;
  }

  if (message.text) {
    estimatedHeight += Math.min(140, 28 + Math.ceil(message.text.length / 36) * 22);
  }

  return estimatedHeight;
};

const MessageSkeleton = memo(({ colors }: { colors: AppColors }) => (
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

const ImageGrid = ({
  attachments,
  chatId,
  isUploading,
  onImageClick,
}: {
  attachments: Attachment[];
  chatId: string | undefined;
  isUploading?: boolean;
  onImageClick?: (payload: ImageOpenPayload) => void;
}) => {
  const count = attachments.length;

  if (count === 1) {
    const source = getAttachmentSource(attachments[0]);
    return isUploading ? (
      <UploadingImageThumb src={source} />
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
        <Box
          component="img"
          src={source}
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
        <FilePreview
          attachment={attachments[0]}
          chatId={chatId!}
          onImageClick={onImageClick}
          variant="small"
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2px",
        borderRadius: "inherit",
        overflow: "hidden",
        maxWidth: 300,
      }}
    >
      {attachments.map((attachment, i) => {
        const isWide = count === 3 && i === 0;
        const source = getAttachmentSource(attachment);

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
              <UploadingImageThumb src={source} fill />
            ) : (
              <FilePreview
                attachment={attachment}
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

const UploadingFilePlaceholder = ({ count }: { count: number }) => (
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

const VoiceAttachmentPreview = ({
  attachment,
  chatId,
  isMine,
}: {
  attachment: Attachment;
  chatId: string;
  isMine: boolean;
}) => {
  const source = getAttachmentSource(attachment);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    source.startsWith("http") || source.startsWith("blob:") ? source : null,
  );

  useEffect(() => {
    if (audioUrl || !source) return;

    let isActive = true;

    api.files.getPrivateUrl(chatId, source).then((res) => {
      if (isActive) {
        setAudioUrl(res.url);
      }
    });

    return () => {
      isActive = false;
    };
  }, [audioUrl, chatId, source]);

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        minWidth: 220,
      }}
    >
      {audioUrl ? (
        <Box
          component="audio"
          controls
          preload="metadata"
          src={audioUrl}
          sx={{
            width: "100%",
            display: "block",
            filter: isMine ? "invert(1) hue-rotate(180deg)" : "none",
          }}
        />
      ) : (
        <LinearProgress sx={{ borderRadius: 2 }} />
      )}
      {attachment.duration_ms ? (
        <Typography sx={{ fontSize: "0.7rem", opacity: 0.65, mt: 0.5 }}>
          {(attachment.duration_ms / 1000).toFixed(1)} сек
        </Typography>
      ) : null}
    </Box>
  );
};

const SystemMessageRow = memo(
  ({ message, colors }: { message: Message; colors: AppColors }) => (
    <Box
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
        {message.text}
      </Typography>
    </Box>
  ),
);

const MessageRow = memo(
  ({
    msg,
    prevMsg,
    nextMsg,
    showDateLabel,
    isGroupChat,
    chatId,
    colors,
    usersById,
    highlighted,
    scrollRef,
    onImageClick,
    onReply,
    onContextMenuOpen,
    onHighlightMessage,
    onJumpToMessage,
  }: MessageRowProps) => {
    const isOnlyEmojis = (text: string) => {
      const regex = emojiRegex();
      const matches = text.match(regex) || [];

      return {
        onlyEmoji: matches.join("") === text.trim(),
        count: matches.length,
      };
    };

    const isMessageFromMe = msg.is_mine;
    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
    const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

    const messageType = inferMessageType(msg);
    const { imageAttachments, voiceAttachments, fileAttachments } =
      splitMessageAttachments(msg);
    const isUploading = !!msg._uploading;
    const sender =
      resolveUser(msg.sender, usersById) ??
      resolveUser(msg.sender_id ? { id: msg.sender_id } : undefined, usersById);
    const replySender = resolveUser(
      msg.reply_to_message?.sender ??
        (msg.reply_to_message?.sender_id
          ? { id: msg.reply_to_message.sender_id }
          : undefined),
      usersById,
    );

    const uploadingNonImageCount = isUploading ? (msg._nonImageCount ?? 0) : 0;
    const hasImages = imageAttachments.length > 0;
    const hasVoice = voiceAttachments.length > 0;
    const hasFiles = fileAttachments.length > 0;
    const hasText = !!msg.text;
    const emojiData = msg.text ? isOnlyEmojis(msg.text) : null;
    const isBigEmoji =
      emojiData?.onlyEmoji && emojiData.count > 0 && emojiData.count <= 1;
    const isPureMedia =
      (messageType === "image" || messageType === "voice") &&
      !hasText &&
      !hasFiles;

    return (
      <Box sx={{ display: "contents" }}>
        {showDateLabel && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <Box
              sx={{
                borderRadius: "19px",
                background:
                  "radial-gradient(circle at 50%, #636363, #CDCDCD 50%, #636363 100%)",
                padding: "2px",
              }}
            >
              <DateLabel
                value={msg.created_at}
                sx={{
                  color: colors.sixth,
                  fontSize: "14px",
                  p: "6px 25px",
                  borderRadius: "19px",
                  bgcolor: colors.second,
                }}
              />
            </Box>
          </Box>
        )}

        <Box
          id={`msg-${msg.id}`}
          onDoubleClick={() => onReply?.(msg)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenuOpen?.({
              mouseX: e.clientX,
              mouseY: e.clientY,
              message: msg,
            });
          }}
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: isMessageFromMe ? "flex-end" : "flex-start",
            gap: 1,
            mb: isLastInGroup ? 2 : 0.4,
            contentVisibility: "auto",
            containIntrinsicSize: "180px",
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
                <UserAvatar
                  user={sender}
                  sx={{
                    width: 45,
                    height: 45,
                    fontSize: "1.2rem",
                    bgcolor: colors.eighth,
                  }}
                />
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
            {!isMessageFromMe && isGroupChat && isFirstInGroup && (
              <UserName
                user={sender}
                short
                fallback="Пользователь"
                sx={{
                  fontSize: "0.8rem",
                  color: colors.eighth,
                  fontWeight: 600,
                  mb: 0.3,
                  ml: 1.5,
                }}
              />
            )}

            {highlighted && (
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
        rgba(255,255,255,0.25) 0%,
        rgba(255,255,255,0.05) 70%,
        transparent 100%
      )`,
                  animation: "fadeHighlight 2s ease forwards",
                  "@keyframes fadeHighlight": {
                    "0%": { opacity: 1 },
                    "100%": { opacity: 0 },
                  },
                }}
              />
            )}

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                borderRadius: isMessageFromMe
                  ? isLastInGroup
                    ? "18px 18px 4px 18px"
                    : "18px"
                  : isLastInGroup
                    ? "18px 18px 18px 4px"
                    : "18px",
                bgcolor: isBigEmoji
                  ? "transparent"
                  : isMessageFromMe
                    ? colors.eighth
                    : colors.second,
                color: isMessageFromMe ? "#fff" : colors.sixth,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                width: "fit-content",
                alignSelf: isMessageFromMe ? "flex-end" : "flex-start",
                maxWidth: "100%",
                boxShadow: isBigEmoji
                  ? "none"
                  : isMessageFromMe
                    ? "0 12px 28px rgba(75, 102, 255, 0.18)"
                    : "var(--surface-glow-soft)",
                transition:
                  "transform var(--motion-fast) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft)",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: isBigEmoji
                    ? "none"
                    : isMessageFromMe
                      ? "0 18px 34px rgba(75, 102, 255, 0.24)"
                      : "var(--surface-glow)",
                },
              }}
            >
              {hasImages && (
                <Box
                  sx={{
                    width: "100%",
                    "& img, & .grid-container": {
                      borderTopLeftRadius: hasText ? 0 : "inherit",
                      borderTopRightRadius: hasText ? 0 : "inherit",
                    },
                  }}
                >
                  <ImageGrid
                    attachments={imageAttachments}
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
                    if (!targetId) return;

                    const container = scrollRef.current;
                    if (container && scrollMessageIntoView(container, targetId)) {
                      onHighlightMessage(targetId);
                    } else if (onJumpToMessage) {
                      void onJumpToMessage(targetId);
                    }
                  }}
                  sx={{
                    px: 1.5,
                    py: 1,
                    bgcolor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition:
                      "transform var(--motion-fast) var(--motion-soft), background-color var(--motion-fast) var(--motion-soft)",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      bgcolor: "rgba(255, 255, 255, 0.17)",
                    },
                  }}
                >
                  <UserName
                    user={replySender}
                    short
                    fallback="Ответ"
                    sx={{ fontSize: "0.75rem", color: "#fff" }}
                  />
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

              {hasText && (
                <Typography
                  sx={{
                    fontSize: isBigEmoji ? "5rem" : "1rem",
                    lineHeight: isBigEmoji ? 1.2 : 1.4,
                    textAlign: isBigEmoji ? "center" : "left",
                    wordBreak: "break-word",
                    p: isBigEmoji ? "6px 10px" : "8px 14px 6px 14px",
                    maxWidth: hasImages ? "220px" : "100%",
                    whiteSpace: "pre-wrap",
                    textWrap: "pretty",
                  }}
                >
                  {msg.text}
                </Typography>
              )}

              {hasVoice && chatId && (
                <Box sx={{ pb: hasText ? 1 : 0.5 }}>
                  {voiceAttachments.map((attachment, index) => (
                    <VoiceAttachmentPreview
                      key={`${getAttachmentSource(attachment)}-${index}`}
                      attachment={attachment}
                      chatId={chatId}
                      isMine={isMessageFromMe}
                    />
                  ))}
                </Box>
              )}

              <Box sx={{ p: hasFiles ? "4px 12px" : 0 }}>
                {!isUploading &&
                  fileAttachments.map((attachment, i) => (
                    <FilePreview
                      key={i}
                      attachment={attachment}
                      chatId={chatId!}
                      onImageClick={onImageClick}
                    />
                  ))}
              </Box>

              {isUploading && uploadingNonImageCount > 0 && (
                <UploadingFilePlaceholder count={uploadingNonImageCount} />
              )}

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
                        mt: -1.5,
                        alignSelf: "flex-end",
                        px: "12px",
                        pb: "6px",
                        pointerEvents: "none",
                      }),
                }}
              >
                {msg.is_edited && (
                  <Typography sx={{ fontSize: "0.7rem", opacity: 0.6 }}>
                    (изменено)
                  </Typography>
                )}
                <TimeText
                  value={msg.created_at}
                  sx={{
                    fontSize: "0.7rem",
                    opacity: isPureMedia ? 0.9 : 0.5,
                  }}
                />

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
                      <MessageReadIndicator
                        message={msg}
                        colors={colors}
                        variant="message"
                        pending={msg._pending || isUploading}
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
  },
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
    onLoadMore,
    canLoadMore = false,
    isLoadingMore = false,
    onContextMenuOpen,
    onLoadNewer,
    canLoadNewer = false,
    isLoadingNewer = false,
    jumpToMessageId,
    onJumpHandled,
    onJumpToMessage,
    onScrollToLatest,
  }: MessageListProps) => {
    const usersById = useUserStore((state) => state.usersById);
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const prevChatIdRef = useRef<string | undefined>(chatId);
    const prevFirstMessageIdRef = useRef<string | null>(
      messages[0]?.id ?? null,
    );
    const prevLastMessageIdRef = useRef<string | null>(
      messages[messages.length - 1]?.id ?? null,
    );
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const shouldRestoreScrollRef = useRef(false);
    const shouldScrollToBottomOnChatOpenRef = useRef(true);
    const stickToBottomRef = useRef(true);
    const editedMapRef = useRef<Record<string, boolean>>({});

    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>(
      {},
    );
    const [viewportState, setViewportState] = useState({
      scrollTop: 0,
      height: 0,
    });

    const messageEntries = useMemo(
      () =>
        messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];
          const currentDate = getChatDateKey(msg.created_at);
          const prevDate = prevMsg ? getChatDateKey(prevMsg.created_at) : null;

          return {
            key: msg.id,
            msg,
            prevMsg,
            nextMsg,
            showDateLabel: currentDate !== prevDate,
          };
        }),
      [messages],
    );

    const virtualLayout = useMemo(() => {
      const offsets: number[] = [];
      let totalHeight = 0;

      for (const entry of messageEntries) {
        offsets.push(totalHeight);
        totalHeight +=
          measuredHeights[entry.key] ??
          estimateMessageEntryHeight(entry.msg, entry.showDateLabel);
      }

      const viewportStart = Math.max(0, viewportState.scrollTop - VIRTUAL_OVERSCAN_PX);
      const viewportEnd =
        viewportState.scrollTop + viewportState.height + VIRTUAL_OVERSCAN_PX;

      let startIndex = 0;
      while (
        startIndex < messageEntries.length &&
        offsets[startIndex] +
          (measuredHeights[messageEntries[startIndex].key] ??
            estimateMessageEntryHeight(
              messageEntries[startIndex].msg,
              messageEntries[startIndex].showDateLabel,
            )) <
          viewportStart
      ) {
        startIndex += 1;
      }

      let endIndex = startIndex;
      while (endIndex < messageEntries.length && offsets[endIndex] < viewportEnd) {
        endIndex += 1;
      }

      const safeStartIndex = Math.max(0, startIndex);
      const safeEndIndex = Math.min(messageEntries.length, endIndex + 1);

      return {
        totalHeight,
        topSpacer: offsets[safeStartIndex] ?? 0,
        bottomSpacer:
          totalHeight - (offsets[safeEndIndex] ?? totalHeight),
        entries: messageEntries.slice(safeStartIndex, safeEndIndex),
      };
    }, [measuredHeights, messageEntries, viewportState]);

    useEffect(() => {
      if (prevChatIdRef.current !== chatId) {
        prevChatIdRef.current = chatId;
        shouldScrollToBottomOnChatOpenRef.current = true;
        shouldRestoreScrollRef.current = false;
        stickToBottomRef.current = true;
        const frameId = window.requestAnimationFrame(() => {
          setMeasuredHeights({});
          setViewportState({ scrollTop: 0, height: 0 });
        });

        return () => window.cancelAnimationFrame(frameId);
      }
    }, [chatId]);

    useEffect(() => {
      const container = scrollRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const observer = new ResizeObserver(() => {
        if (
          shouldScrollToBottomOnChatOpenRef.current ||
          stickToBottomRef.current
        ) {
          container.scrollTop = container.scrollHeight;
        }
      });

      observer.observe(content);
      return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
      const container = scrollRef.current;
      if (!container) return;

      const firstMessageId = messages[0]?.id ?? null;
      const lastMessageId = messages[messages.length - 1]?.id ?? null;
      const prevFirstMessageId = prevFirstMessageIdRef.current;
      const prevLastMessageId = prevLastMessageIdRef.current;
      const isInitialRender = prevLastMessageId === null;
      const prependedOlderMessages =
        shouldRestoreScrollRef.current &&
        firstMessageId !== prevFirstMessageId &&
        lastMessageId === prevLastMessageId;
      const appendedNewMessages = lastMessageId !== prevLastMessageId;

      if (
        shouldScrollToBottomOnChatOpenRef.current &&
        !isMsgsLoading &&
        messages.length > 0
      ) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "auto",
        });
        shouldScrollToBottomOnChatOpenRef.current = false;
      } else if (isInitialRender) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "auto",
        });
      } else if (prependedOlderMessages) {
        const scrollDelta =
          container.scrollHeight - prevScrollHeightRef.current;
        container.scrollTop = prevScrollTopRef.current + scrollDelta;
        shouldRestoreScrollRef.current = false;
      } else if (appendedNewMessages) {
        const distanceFromBottom =
          prevScrollHeightRef.current -
          prevScrollTopRef.current -
          container.clientHeight;
        const wasNearBottom = distanceFromBottom <= 120;

        if (wasNearBottom) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "auto",
          });
        }
      }

      prevFirstMessageIdRef.current = firstMessageId;
      prevLastMessageIdRef.current = lastMessageId;
      prevScrollHeightRef.current = container.scrollHeight;
      prevScrollTopRef.current = container.scrollTop;
    }, [isMsgsLoading, messages]);

    useEffect(() => {
      const container = scrollRef.current;
      if (!container) return;

      const handleScroll = () => {
        prevScrollHeightRef.current = container.scrollHeight;
        prevScrollTopRef.current = container.scrollTop;
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        stickToBottomRef.current = distanceFromBottom <= 120;
        setShowScrollToBottom(distanceFromBottom > 220);
        setViewportState({
          scrollTop: container.scrollTop,
          height: container.clientHeight,
        });

        if (onLoadMore && canLoadMore && !isLoadingMore && container.scrollTop <= 80) {
          shouldRestoreScrollRef.current = true;
          onLoadMore();
        }

        if (
          onLoadNewer &&
          canLoadNewer &&
          !isLoadingNewer &&
          distanceFromBottom <= 80
        ) {
          onLoadNewer();
        }
      };

      handleScroll();
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, [
      canLoadMore,
      canLoadNewer,
      isLoadingMore,
      isLoadingNewer,
      onLoadMore,
      onLoadNewer,
    ]);

    const highlightMessage = useCallback((id: string) => {
      setHighlightedId(id);

      const timer = window.setTimeout(() => {
        setHighlightedId((current) => (current === id ? null : current));
      }, 2000);

      return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!jumpToMessageId) return;

      const container = scrollRef.current;
      if (!container) return;

      const clearTimers: number[] = [];

      const runScroll = (behavior: ScrollBehavior = "smooth") =>
        scrollMessageIntoView(container, jumpToMessageId, behavior);

      const didScroll = runScroll();
      if (!didScroll) return;

      const frameId = window.requestAnimationFrame(() => {
        highlightMessage(jumpToMessageId);
        onJumpHandled?.();
      });
      clearTimers.push(
        window.setTimeout(() => runScroll("auto"), 180),
        window.setTimeout(() => runScroll("auto"), 520),
      );

      return () => {
        window.cancelAnimationFrame(frameId);
        clearTimers.forEach((timerId) => window.clearTimeout(timerId));
      };
    }, [highlightMessage, jumpToMessageId, messages, onJumpHandled]);

    useEffect(() => {
      const editedSystemMessage = messages.find(
        (msg) =>
          msg.is_system && msg.is_edited && !editedMapRef.current[msg.id],
      );

      if (!editedSystemMessage) return;

      editedMapRef.current[editedSystemMessage.id] = true;
      const clearHighlight = highlightMessage(editedSystemMessage.id);

      return clearHighlight;
    }, [highlightMessage, messages]);

    const showSkeleton = isMsgsLoading && messages.length === 0;
    const isGroupChat = (chatData?.member_count ?? 0) > 2;

    return (
      <Box
        ref={scrollRef}
        data-chat-scroll
        sx={{
          position: "relative",
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Box ref={contentRef} sx={{ display: "flex", flexDirection: "column" }}>
          {showSkeleton ? (
            <MessageSkeleton colors={colors} />
          ) : (
            <>
              {isLoadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                  <LinearProgress sx={{ width: 120, borderRadius: 2 }} />
                </Box>
              )}

              {virtualLayout.topSpacer > 0 && (
                <Box sx={{ height: virtualLayout.topSpacer }} />
              )}

              {virtualLayout.entries.map((entry) => (
                <Box
                  key={entry.key}
                  ref={(node: HTMLDivElement | null) => {
                    if (!node) return;

                    const nextHeight = node.offsetHeight;
                    setMeasuredHeights((current) =>
                      current[entry.key] === nextHeight
                        ? current
                        : {
                            ...current,
                            [entry.key]: nextHeight,
                          },
                    );
                  }}
                >
                  {entry.msg.is_system ? (
                    <SystemMessageRow message={entry.msg} colors={colors} />
                  ) : (
                    <MessageRow
                      msg={entry.msg}
                      prevMsg={entry.prevMsg}
                      nextMsg={entry.nextMsg}
                      showDateLabel={entry.showDateLabel}
                      isGroupChat={isGroupChat}
                      chatId={chatId}
                      colors={colors}
                      usersById={usersById}
                      highlighted={highlightedId === entry.msg.id}
                      scrollRef={scrollRef}
                      onImageClick={onImageClick}
                      onReply={onReply}
                      onContextMenuOpen={onContextMenuOpen}
                      onHighlightMessage={highlightMessage}
                      onJumpToMessage={onJumpToMessage}
                    />
                  )}
                </Box>
              ))}

              {virtualLayout.bottomSpacer > 0 && (
                <Box sx={{ height: virtualLayout.bottomSpacer }} />
              )}
            </>
          )}
        </Box>

        <IconButton
          onClick={() => {
            if (onScrollToLatest) {
              void onScrollToLatest();
              return;
            }

            scrollRef.current?.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            });
          }}
          sx={{
            position: "sticky",
            alignSelf: "flex-end",
            bottom: { xs: 12, sm: 16 },
            mr: { xs: 0, sm: 0.5 },
            mt: -7,
            zIndex: 5,
            width: { xs: 40, sm: 46 },
            height: { xs: 40, sm: 46 },
            bgcolor: colors.second,
            color: colors.sixth,
            border: `1px solid ${colors.fourth}`,
            boxShadow: showScrollToBottom
              ? "0 10px 24px rgba(0,0,0,0.22)"
              : "0 4px 12px rgba(0,0,0,0.08)",
            opacity: showScrollToBottom ? 1 : 0,
            transform: showScrollToBottom
              ? "translateY(0) scale(1)"
              : "translateY(12px) scale(0.92)",
            pointerEvents: showScrollToBottom ? "auto" : "none",
            transition:
              "opacity var(--motion-fast) var(--motion-soft), transform var(--motion-base) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft), background-color var(--motion-fast) var(--motion-soft)",
            "&:hover": {
              bgcolor: colors.fourth,
              boxShadow: "0 14px 28px rgba(0,0,0,0.26)",
            },
            "&::after": canLoadNewer
              ? {
                  content: '""',
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: colors.eighth,
                  boxShadow: `0 0 0 4px ${colors.second}`,
                }
              : undefined,
          }}
        >
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
        </IconButton>
      </Box>
    );
  },
);

export default MessageList;
