import { Box, Typography, useTheme, IconButton } from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import NewMessageCustomIcon from "../../assets/icons/new_message.svg?react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatSearch from "./ChatSearch";
import ChatListItems from "./ChatListItems";
import UserSearchResults from "./UserSearchResults";
import { chatSelectors, useChatsStore } from "../../stores/useChatsStore";
import type { User } from "../../types";
import NewChatModal from "../Ui/NewChatModal";

const ChatList = () => {
  const chats = useChatsStore(chatSelectors.chats);
  const isLoading = useChatsStore(chatSelectors.isLoading);
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const theme = useTheme();
  const colors = theme.palette.background;
  const isSearching = searchQuery.trim().length > 0;

  const [openNewChatModal, setOpenNewChatModal] = useState(false);

  // Поиск пользователей по беку при изменении query
  useEffect(() => {
    if (!isSearching) {
      setUserResults([]);
      return;
    }
    setUsersLoading(true);
    api.users
      .search(searchQuery)
      .then((res) => setUserResults(res))
      .catch(() => setUserResults([]))
      .finally(() => setUsersLoading(false));
  }, [searchQuery]);

  return (
    <Box
      sx={{
        width: 400,
        bgcolor: colors.second,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: colors.sixth, fontSize: 36 }}
          >
            Мессенджер
          </Typography>
          <KeyboardArrowDownIcon />
        </Box>
        <IconButton
          sx={{ color: colors.wb }}
          onClick={() => setOpenNewChatModal(true)}
        >
          <NewMessageCustomIcon width={24} height={24} />
        </IconButton>
      </Box>

      <ChatSearch value={searchQuery} onChange={setSearchQuery} />

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
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

        {!isSearching && <ChatListItems chats={chats} isLoading={isLoading} />}
      </Box>
      <NewChatModal
        open={openNewChatModal}
        onClose={() => setOpenNewChatModal(false)}
      />
    </Box>
  );
};

export default ChatList;
