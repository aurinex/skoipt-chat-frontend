import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Chip,
  CircularProgress,
  Fade,
  Backdrop,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import type { User } from "../../types";
import AppTextField from "../Ui/AppTextField";
import { useTheme } from "@mui/material";

type Mode = "direct" | "group" | "channel";

const NewChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = theme.palette.background;

  const [mode, setMode] = useState<Mode>("direct");
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;

    // текущая высота
    const startHeight = el.offsetHeight;

    setHeight(startHeight);

    requestAnimationFrame(() => {
      if (!contentRef.current) return;

      const endHeight = contentRef.current.scrollHeight;

      setHeight(endHeight);
    });
  }, [mode, selectedUsers.length, results.length]);

  // 🔍 поиск
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(() => {
      setLoading(true);
      api.users
        .search(search)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  // 🧹 очистка
  useEffect(() => {
    if (!open) {
      setMode("direct");
      setName("");
      setSelectedUsers([]);
      setSearch("");
      setResults([]);
    }
  }, [open]);

  const handleSelectUser = (user: User) => {
    if (mode === "direct") {
      navigate(`/chat/new?userId=${user.id}`);
      onClose();
      return;
    }

    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id) ? prev : [...prev, user],
    );
  };

  const removeUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleCreate = async () => {
    try {
      if (mode === "group") {
        if (!name || selectedUsers.length === 0) return;

        const chat = (await api.chats.createGroup({
          name,
          member_ids: selectedUsers.map((u) => u.id),
        })) as { id: string };

        navigate(`/chat/${chat.id}`);
      }

      if (mode === "channel") {
        if (!name) return;

        const chat = (await api.chats.createChannel({ name })) as {
          id: string;
        };

        navigate(`/chat/${chat.id}`);
      }

      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const canCreate =
    (mode === "group" && name && selectedUsers.length > 0) ||
    (mode === "channel" && name);

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
            width: { xs: "95vw", sm: 420 },
            maxHeight: "90vh",
            bgcolor: colors.second,
            borderRadius: "20px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "height 0.25s ease",
          }}
        >
          {/* 🔹 HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: "16px 20px 12px",
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                color: colors.sixth,
                fontSize: "1rem",
              }}
            >
              Новый чат
            </Typography>

            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: colors.fiveth }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 🔹 CONTENT */}
          <Box
            sx={{
              overflow: "hidden",
              height,
              transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Box
              ref={contentRef}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                px: 2,
                pb: 2,
              }}
            >
              <Tabs
                value={mode}
                onChange={(_, v) => setMode(v)}
                TabIndicatorProps={{ style: { display: "none" } }}
                sx={{
                  minHeight: "36px",
                  justifyContent: "space-around",

                  "& .MuiTab-root": {
                    textTransform: "none",
                    minHeight: "36px",
                    color: colors.fiveth,
                    transition: "all 0.2s ease",

                    // ❗ убираем hover
                    "&:hover": {
                      backgroundColor: "transparent",
                    },

                    // ❗ убираем active
                    "&:active": {
                      backgroundColor: "transparent",
                    },
                  },

                  "& .Mui-selected": {
                    color: colors.sixth,
                  },
                }}
              >
                <Tab disableRipple value="direct" label="Личка" />
                <Tab disableRipple value="group" label="Беседа" />
                <Tab disableRipple value="channel" label="Канал" />
              </Tabs>

              <Fade in timeout={200} key={mode}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {mode !== "direct" && (
                    <AppTextField
                      value={name}
                      onChange={setName}
                      placeholder="Название"
                    />
                  )}

                  {mode !== "channel" && selectedUsers.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {selectedUsers.map((u) => (
                        <Chip
                          key={u.id}
                          label={`${u.first_name} ${u.last_name}`}
                          onDelete={() => removeUser(u.id)}
                          sx={{
                            bgcolor: colors.fourth,
                            color: colors.sixth,
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {mode !== "channel" && (
                    <AppTextField
                      value={search}
                      onChange={setSearch}
                      placeholder="Поиск"
                    />
                  )}

                  {mode !== "channel" && (
                    <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                      {loading && <CircularProgress size={20} />}

                      <List>
                        {results.map((user) => (
                          <ListItem key={user.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleSelectUser(user)}
                              sx={{
                                borderRadius: "12px",
                                "&:hover": { bgcolor: colors.third },
                              }}
                            >
                              <Avatar
                                src={user.avatar_url ?? undefined}
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography sx={{ color: colors.sixth }}>
                                  {user.first_name} {user.last_name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    color: colors.fiveth,
                                  }}
                                >
                                  @{user.username}
                                </Typography>
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </Fade>
            </Box>
          </Box>

          {/* 🔹 FOOTER */}
          {mode !== "direct" && (
            <Box sx={{ p: "0 16px 16px" }}>
              <Button
                fullWidth
                disabled={!canCreate}
                onClick={handleCreate}
                sx={{
                  height: 44,
                  borderRadius: "16px",
                  bgcolor: colors.eighth,
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": { bgcolor: colors.eighth, opacity: 0.85 },
                  "&.Mui-disabled": {
                    bgcolor: colors.eighth,
                    opacity: 0.4,
                    color: "#fff",
                  },
                }}
              >
                Создать
              </Button>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default NewChatModal;
