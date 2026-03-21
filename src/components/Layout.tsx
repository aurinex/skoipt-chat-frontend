import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api, { socket } from "../services/api";
import Navbar from "./Navbar";
import ChatList from "./ChatList";
import { useTheme } from "@mui/material";

const Layout = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const theme = useTheme();
  const colors = theme.palette.background;

  // 1. Создаем ОДНУ универсальную функцию обновления чата
  const handleUpdateChat = useCallback((msg: any) => {
    const myId = Number(localStorage.getItem("user_id"));

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(
        (c) => String(c.id) === String(msg.chat_id),
      );

      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];

      // Формируем объект сообщения, гарантируя наличие is_mine
      const lastMessage = {
        ...msg,
        // Если бэкенд не прислал is_mine, вычисляем его сами по ID
        is_mine: msg.is_mine ?? Number(msg.sender_id) === myId,
      };

      const targetChat = {
        ...updatedChats[chatIndex],
        last_message: lastMessage,
      };

      // Перемещаем чат на первое место
      updatedChats.splice(chatIndex, 1);
      return [targetChat, ...updatedChats];
    });
  }, []);

  useEffect(() => {
    // Загрузка начального списка
    setIsLoading(true);
    api.chats
      .list()
      .then((data) => {
        // При первой загрузке тоже проверяем сообщения на "свои"
        const myId = Number(localStorage.getItem("user_id"));
        const processedData = data.map((chat: any) => ({
          ...chat,
          last_message: chat.last_message
            ? {
                ...chat.last_message,
                is_mine:
                  chat.last_message.is_mine ??
                  Number(chat.last_message.sender_id) === myId,
              }
            : null,
        }));

        setChats(processedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки чатов:", err);
        setIsLoading(false);
      });

    // 2. Подписка на сокеты (используем ту же функцию)
    const handleSocketMessage = (data: any) => {
      const msg = data.message || data;
      handleUpdateChat(msg);
    };

    socket.on("new_message", handleSocketMessage);

    const unsubscribe = socket.on("new_message", handleSocketMessage);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [handleUpdateChat]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ padding: "54px 0 54px 25px" }}>
        <Navbar orientation="vertical" />
      </Box>

      <Box sx={{ margin: "0px 36px 0px 36px" }}>
        <ChatList chats={chats} isLoading={isLoading} />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Outlet context={{ handleUpdateChat }} />
      </Box>
    </Box>
  );
};

export default Layout;
