import {
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Typography,
  Box,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_online: boolean;
  role: string;
  group?: string;
  course?: number;
}

interface UserSearchResultsProps {
  users: User[];
  isLoading: boolean;
  query: string;
}

const UserSearchResults = ({
  users,
  isLoading,
  query,
}: UserSearchResultsProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!users.length && query.trim()) {
    return (
      <Typography sx={{ color: colors.fiveth, fontSize: 14, px: 1.5, mt: 1 }}>
        Пользователей не найдено
      </Typography>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {users.map((user) => (
        <ListItem key={user.id} disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => navigate(`/chat/new?userId=${user.id}`)}
            sx={{
              borderRadius: "24px",
              p: 1.5,
              "&:hover": { bgcolor: colors.third },
              transition: "background-color 0.2s",
            }}
          >
            <Box sx={{ position: "relative", mr: 2 }}>
              <Avatar
                src={user.avatar_url ?? undefined}
                sx={{ width: 50, height: 50 }}
              />
              {user.is_online && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#4caf50",
                    border: "2px solid",
                    borderColor: colors.second,
                  }}
                />
              )}
            </Box>
            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
              <Typography
                sx={{
                  color: colors.sixth,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
                noWrap
              >
                {user.first_name} {user.last_name}
              </Typography>
              <Typography
                sx={{ color: colors.fiveth, fontSize: "0.85rem" }}
                noWrap
              >
                @{user.username}
                {user.group ? ` · ${user.group}` : ""}
              </Typography>
            </Box>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default UserSearchResults;
