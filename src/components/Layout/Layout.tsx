import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { socket, getMyId } from "../../services/api";
import Navbar from "./Navbar";
import ChatList from "../Chat/ChatList";
import type { Message, Chat } from "../../types";
import { useChatsStore } from "../../stores/useChatsStore";

const Layout = () => {
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const loadChats = useChatsStore((state) => state.loadChats);
  const updateChatFromMessage = useChatsStore(
    (state) => state.updateChatFromMessage,
  );
  const setChatTyping = useChatsStore((state) => state.setChatTyping);
  const markChatLastMessageRead = useChatsStore(
    (state) => state.markChatLastMessageRead,
  );
  const syncUnreadCount = useChatsStore((state) => state.syncUnreadCount);
  const prependChat = useChatsStore((state) => state.prependChat);
  const removeChat = useChatsStore((state) => state.removeChat);

  useEffect(() => {
    const sound = new Audio("/sounds/message.mp3");
    sound.volume = 0.5;
    notificationSoundRef.current = sound;
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const unsubTyping = socket.on("typing", (data: { chat_id: string; is_typing: boolean }) => {
      setChatTyping(data.chat_id, data.is_typing);
    });

    const unsubMsg = socket.on("new_message", (data: { message?: Message } & Message) => {
      const msg = data.message || data;
      updateChatFromMessage(msg);
      const myId = getMyId();

      if (String(msg.sender_id) !== String(myId)) {
        const sound = notificationSoundRef.current;
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(() => {});
        }
      }
    });

    const unsubRead = socket.on(
      "read",
      (data: { chat_id: string; message_ids: string[] }) => {
        markChatLastMessageRead(data.chat_id, data.message_ids);
      },
    );

    const unsubUnread = socket.on(
      "unread_count",
      (data: { chat_id: string; unread_count: number }) => {
        syncUnreadCount(data.chat_id, data.unread_count);
      },
    );

    const unsubNewChat = socket.on("new_chat", (data: { chat: Chat }) => {
      prependChat(data.chat);
    });

    const unsubKicked = socket.on("kicked", (data: { chat_id: string }) => {
      removeChat(data.chat_id);
    });

    const unsubLeft = socket.on("left_chat", (data: { chat_id: string }) => {
      removeChat(data.chat_id);
    });

    return () => {
      unsubTyping();
      unsubMsg();
      unsubRead();
      unsubUnread();
      unsubNewChat();
      unsubKicked();
      unsubLeft();
    };
  }, [
    markChatLastMessageRead,
    prependChat,
    removeChat,
    setChatTyping,
    syncUnreadCount,
    updateChatFromMessage,
  ]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ padding: "30px 0 30px 25px" }}>
        <Navbar orientation="vertical" />
      </Box>

      <Box sx={{ padding: "30px 36px 0px 36px" }}>
        <ChatList />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
