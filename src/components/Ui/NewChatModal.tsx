import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import type { User } from "../../types";

type Mode = "direct" | "group" | "channel";

const NewChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("direct");
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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
      // ✅ используем твой существующий flow
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
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 400,
          bgcolor: "#1e1e1e",
          p: 2,
          borderRadius: 3,
          mx: "auto",
          mt: "10vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6">Новый чат</Typography>

        <Tabs value={mode} onChange={(_, v) => setMode(v)}>
          <Tab value="direct" label="Личка" />
          <Tab value="group" label="Беседа" />
          <Tab value="channel" label="Канал" />
        </Tabs>

        {mode !== "direct" && (
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            size="small"
          />
        )}

        {mode !== "channel" && selectedUsers.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {selectedUsers.map((u) => (
              <Chip
                key={u.id}
                label={`${u.first_name} ${u.last_name}`}
                onDelete={() => removeUser(u.id)}
              />
            ))}
          </Box>
        )}

        {mode !== "channel" && (
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск"
            size="small"
          />
        )}

        {mode !== "channel" && (
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {loading && <CircularProgress size={20} />}

            <List>
              {results.map((user) => (
                <ListItem key={user.id} disablePadding>
                  <ListItemButton onClick={() => handleSelectUser(user)}>
                    <Avatar src={user.avatar_url ?? undefined} sx={{ mr: 2 }} />
                    <Box>
                      <Typography>
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, opacity: 0.6 }}>
                        @{user.username}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {mode !== "direct" && (
          <Button
            variant="contained"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Создать
          </Button>
        )}
      </Box>
    </Modal>
  );
};

export default NewChatModal;
