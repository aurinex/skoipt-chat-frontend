import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { socket } from "../services/api";
import Navbar from "./Navbar";
import ChatList from "./ChatList";
import { useTheme } from "@mui/material";

const Layout = () => {
  const [chats, setChats] = useState<any[]>([]);
  const theme = useTheme();
  const colors = theme.palette.background;

  const handleUpdateChat = (msg: any) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(
        (c) => String(c.id) === String(msg.chat_id),
      );
      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];
      const targetChat = {
        ...updatedChats[chatIndex],
        last_message: {
          ...msg,
          is_mine: msg.is_mine ?? true, // Убеждаемся, что флаг "мое" проставлен
        },
      };

      updatedChats.splice(chatIndex, 1);
      return [targetChat, ...updatedChats];
    });
  };

  useEffect(() => {
    api.chats
      .list()
      .then(setChats)
      .catch(() => {});

    // Подписка на сокеты для обновления списка чатов слева
    const unsubMsg = socket.on("new_message", ({ message }: any) => {
      /* логика обновления списка chats как раньше */
    });

    return () => unsubMsg();
  }, []);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      const msg = data.message || data;

      setChats((prevChats) => {
        const updated = prevChats.map((chat) => {
          if (String(chat.id) === String(msg.chat_id)) {
            return {
              ...chat,
              last_message: msg, // Обновляем последнее сообщение
            };
          }
          return chat;
        });

        // Сортируем: чат с новым сообщением в самый верх
        return updated.sort((a, b) => {
          const timeA = new Date(a.last_message?.created_at || 0).getTime();
          const timeB = new Date(b.last_message?.created_at || 0).getTime();
          return timeB - timeA;
        });
      });
    };

    const unsubscribe = socket.on("new_message", handleNewMessage);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const updateChatLastMessage = (message: any) => {
    setChats((prevChats) => {
      // 1. Находим чат, в который пришло сообщение
      const chatIndex = prevChats.findIndex(
        (c) => String(c.id) === String(message.chat_id),
      );
      if (chatIndex === -1) return prevChats;

      const updatedChats = [...prevChats];
      const targetChat = { ...updatedChats[chatIndex] };

      // 2. Обновляем данные последнего сообщения
      targetChat.last_message = {
        text: message.text,
        is_mine: message.is_mine,
        is_read: message.is_read,
        created_at: message.created_at,
      };

      // 3. Удаляем чат из текущей позиции и вставляем в начало массива
      updatedChats.splice(chatIndex, 1);
      return [targetChat, ...updatedChats];
    });
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ padding: "54px 0 54px 25px" }}>
        <Navbar orientation="vertical" />
      </Box>

      <Box sx={{ margin: "0px 36px 0px 36px" }}>
        <ChatList chats={chats} />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <Outlet context={{ handleUpdateChat }} />
      </Box>
    </Box>
  );
};

export default Layout;
