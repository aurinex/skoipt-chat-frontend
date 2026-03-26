import {
  Box,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import { type MouseEvent, useMemo, useState } from "react";
import NewMessageCustomIcon from "../../assets/icons/new_message.svg?react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatSearch from "./ChatSearch";
import ChatListItems from "./ChatListItems";
import UserSearchResults from "./UserSearchResults";
import NewChatModal from "../Ui/NewChatModal";
import { useChatsQuery } from "../../queries/useChatsQuery";
import { useUsersSearchQuery } from "../../queries/useUsersSearchQuery";
import { useResponsive } from "../../hooks/useResponsive";
import type { Chat } from "../../types";
import { useBlinkingTitle } from "../../hooks/useBlinkingTitle";

type ChatFilterMode = "direct" | "channel" | "group" | "custom";

const ALL_CHAT_TYPES: Chat["type"][] = ["direct", "channel", "group"];

const FILTER_TITLES: Record<Exclude<ChatFilterMode, "custom">, string> = {
  direct: "Диалоги",
  channel: "Каналы",
  group: "Беседы",
};

const ChatList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<ChatFilterMode>("custom");
  const [selectedTypes, setSelectedTypes] =
    useState<Chat["type"][]>(ALL_CHAT_TYPES);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openNewChatModal, setOpenNewChatModal] = useState(false);

  const theme = useTheme();
  const colors = theme.palette.background;
  const { isMobile } = useResponsive();
  const isSearching = searchQuery.trim().length > 0;

  const typeParam = useMemo(() => {
    if (filterMode !== "custom") {
      return filterMode;
    }

    if (
      selectedTypes.length === 0 ||
      selectedTypes.length === ALL_CHAT_TYPES.length
    ) {
      return "all";
    }

    return selectedTypes.join(",");
  }, [filterMode, selectedTypes]);

  const listTitle =
    filterMode === "custom" ? "Мессенджер" : FILTER_TITLES[filterMode];

  const { data: chats = [], isPending: isChatsLoading } =
    useChatsQuery(typeParam);

  const totalUnreadCount = useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unread_count ?? 0), 0);
  }, [chats]);

  useBlinkingTitle({
    unreadCount: totalUnreadCount,
    defaultTitle: "Мессенджер",
    interval: 2000,
  });

  const { data: userResults = [], isPending: usersLoading } =
    useUsersSearchQuery(searchQuery);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handlePresetSelect = (mode: Exclude<ChatFilterMode, "custom">) => {
    setFilterMode(mode);
    setSelectedTypes([mode]);
    handleMenuClose();
  };

  const handleCustomSelect = () => {
    setFilterMode("custom");
  };

  const handleCustomToggle = (type: Chat["type"]) => {
    setFilterMode("custom");
    setSelectedTypes((current) => {
      const next = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return next.length > 0 ? next : current;
    });
  };

  const renderFilterIcon = (type: Chat["type"]) => {
    if (filterMode !== "custom") {
      return <ListItemIcon sx={{ minWidth: 16 }} />;
    }

    return (
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Checkbox
          edge="start"
          checked={selectedTypes.includes(type)}
          tabIndex={-1}
          disableRipple
          onClick={(event) => {
            event.stopPropagation();
            handleCustomToggle(type);
          }}
        />
      </ListItemIcon>
    );
  };

  return (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          animation: "softFadeUp var(--motion-base) var(--motion-spring)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.sixth,
              fontSize: isMobile ? 28 : 36,
            }}
          >
            {listTitle}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            disableFocusRipple
            disableRipple
            sx={{
              color: colors.wb,
              transform: menuAnchorEl ? "rotate(180deg)" : "rotate(0deg)",
              transition:
                "transform, color var(--motion-fast) var(--motion-soft)",
              ":hover": { color: colors.fiveth, borderColor: "transparent" },
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
        <IconButton
          sx={{ color: colors.wb }}
          onClick={() => setOpenNewChatModal(true)}
        >
          <NewMessageCustomIcon width={24} height={24} />
        </IconButton>
      </Box>

      <ChatSearch value={searchQuery} onChange={setSearchQuery} />

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          pb: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 104px)" : 0,
          animation: "softFadeIn var(--motion-slow) var(--motion-soft)",
        }}
      >
        {isSearching && (
          <>
            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 12,
                px: 1.5,
                mb: 0.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Чаты
            </Typography>
            <ChatListItems chats={chats} searchQuery={searchQuery} />

            <Typography
              sx={{
                color: colors.fiveth,
                fontSize: 12,
                px: 1.5,
                mt: 2,
                mb: 0.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Люди
            </Typography>
            <UserSearchResults
              users={userResults}
              isLoading={usersLoading}
              query={searchQuery}
            />
          </>
        )}

        {!isSearching && (
          <ChatListItems chats={chats} isLoading={isChatsLoading} />
        )}
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={!!menuAnchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem
          selected={filterMode === "direct"}
          onClick={() => handlePresetSelect("direct")}
        >
          {renderFilterIcon("direct")}
          <ListItemText>Диалоги</ListItemText>
        </MenuItem>
        <MenuItem
          selected={filterMode === "channel"}
          onClick={() => handlePresetSelect("channel")}
        >
          {renderFilterIcon("channel")}
          <ListItemText>Каналы</ListItemText>
        </MenuItem>
        <MenuItem
          selected={filterMode === "group"}
          onClick={() => handlePresetSelect("group")}
        >
          {renderFilterIcon("group")}
          <ListItemText>Беседы</ListItemText>
        </MenuItem>
        <MenuItem
          selected={filterMode === "custom"}
          onClick={handleCustomSelect}
        >
          <ListItemIcon sx={{ minWidth: 16 }} />
          <ListItemText>Кастом</ListItemText>
        </MenuItem>
      </Menu>

      <NewChatModal
        open={openNewChatModal}
        onClose={() => setOpenNewChatModal(false)}
      />
    </Box>
  );
};

export default ChatList;
