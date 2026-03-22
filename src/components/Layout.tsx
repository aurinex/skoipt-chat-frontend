import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api, { getMyId, socket } from "../services/api";
import Navbar from "./Navbar";
import ChatList from "./Chat/ChatList";
import { useTheme } from "@mui/material";

const Layout = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notificationSound = new Audio("/sounds/message.mp3");
  notificationSound.volume = 0.5;

  const theme = useTheme();
  const colors = theme.palette.background;

  const handleUpdateChat = useCallback((msg: any) => {
    const myId = getMyId();

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(
        (c) => String(c.id) === String(msg.chat_id),
      );

      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];

      const lastMessage = {
        ...msg,
        is_mine: msg.is_mine ?? String(msg.sender_id) === String(myId),
      };

      const targetChat = {
        ...updatedChats[chatIndex],
        last_message: lastMessage,
      };

      updatedChats.splice(chatIndex, 1);
      return [targetChat, ...updatedChats];
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api.chats
      .list()
      .then((data) => {
        const myId = getMyId();
        const processedData = data.map((chat: any) => ({
          ...chat,
          last_message: chat.last_message
            ? {
                ...chat.last_message,
                is_mine:
                  chat.last_message.is_mine ??
                  String(chat.last_message.sender_id) === String(myId),
              }
            : null,
        }));

        setChats(processedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки чатов:", err);
        setIsLoading(true);
      });

    const handleSocketMessage = (data: any) => {
      const msg = data.message || data;
      handleUpdateChat(msg);
      const myId = getMyId();
      if (String(msg.sender_id) !== String(myId)) {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
      }
    };

    const unsubscribe = socket.on("new_message", handleSocketMessage);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [handleUpdateChat]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ padding: "30px 0 30px 25px" }}>
        <Navbar orientation="vertical" />
      </Box>

      <Box sx={{ padding: "30px 36px 0px 36px" }}>
        <ChatList chats={chats} isLoading={isLoading} />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Outlet context={{ handleUpdateChat }} />
      </Box>
    </Box>
  );
};

export default Layout;
