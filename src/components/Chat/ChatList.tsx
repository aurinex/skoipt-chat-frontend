import { Box, Typography, useTheme, IconButton } from "@mui/material";
import { useState } from "react";
import NewMessageCustomIcon from "../../assets/icons/new_message.svg?react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatSearch from "./ChatSearch";
import ChatListItems from "./ChatListItems";
import UserSearchResults from "./UserSearchResults";
import NewChatModal from "../Ui/NewChatModal";
import { useChatsQuery } from "../../queries/useChatsQuery";
import { useUsersSearchQuery } from "../../queries/useUsersSearchQuery";

const ChatList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const colors = theme.palette.background;
  const isSearching = searchQuery.trim().length > 0;
  const { data: chats = [], isPending: isChatsLoading } = useChatsQuery();
  const { data: userResults = [], isPending: usersLoading } =
    useUsersSearchQuery(searchQuery);

  const [openNewChatModal, setOpenNewChatModal] = useState(false);

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

        {!isSearching && (
          <ChatListItems chats={chats} isLoading={isChatsLoading} />
        )}
      </Box>
      <NewChatModal
        open={openNewChatModal}
        onClose={() => setOpenNewChatModal(false)}
      />
    </Box>
  );
};

export default ChatList;
