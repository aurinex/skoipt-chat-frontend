import { useRef, useEffect, memo, useCallback } from "react";
import { Box, Typography, Avatar, Skeleton, Tooltip } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilePreview from "./FilePreview";
import { formatLocalTime, formatDateLabel } from "../utils/chatFormatters";

interface MessageListProps {
  messages: any[];
  isMsgsLoading: boolean;
  chatData: any;
  myId: string | null;
  chatId: string | undefined;
  colors: any;
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
  const items = [];
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

const MessageList = memo(
  ({
    messages,
    isMsgsLoading,
    chatData,
    myId,
    chatId,
    colors,
  }: MessageListProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    // Отслеживаем предыдущий chatId чтобы мгновенно показать скелетон при смене чата
    const prevChatIdRef = useRef(chatId);
    const isChangingChat = prevChatIdRef.current !== chatId;
    if (isChangingChat) prevChatIdRef.current = chatId;

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
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: isMessageFromMe ? "flex-end" : "flex-start",
                    gap: 1,
                    mb: isLastInGroup ? 2 : 0.4,
                    mt: showDateLabel && !isFirstInGroup ? 1 : 0,
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
                          src={msg.sender?.avatar_url}
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
                      chatData?.member_count > 2 &&
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

                    <Box
                      sx={{
                        p: "8px 14px",
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
                        boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
                        position: "relative",
                        // Слегка приглушаем pending-сообщения
                        opacity: msg._pending ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.text}
                      </Typography>
                      {msg.file_url && (
                        <FilePreview fileUrl={msg.file_url} chatId={chatId} />
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                          mt: 0.2,
                        }}
                      >
                        <Typography sx={{ fontSize: "0.7rem", opacity: 0.5 }}>
                          {formatLocalTime(msg.created_at)}
                        </Typography>

                        {isMessageFromMe && (
                          <>
                            {msg._failed ? (
                              // Ошибка отправки — красная иконка с тултипом
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
                                  color: msg._pending
                                    ? "rgba(255,255,255,0.3)" // бледная галочка пока pending
                                    : msg.read_by?.length > 0
                                      ? "rgba(255,255,255,1)" // прочитано
                                      : "rgba(255,255,255,0.5)", // доставлено
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
