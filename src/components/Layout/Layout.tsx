import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { socket, getMyId } from "../../services/api";
import Navbar from "./Navbar";
import ChatList from "../Chat/ChatList";
import { useChatListCacheActions } from "../../queries/chatListCache";

const Layout = () => {
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const {
    updateChatFromMessage,
    setChatTyping,
    markChatLastMessageRead,
    syncUnreadCount,
    prependChat,
    removeChat,
  } = useChatListCacheActions();

  useEffect(() => {
    const sound = new Audio("/sounds/message.mp3");
    sound.volume = 0.5;
    notificationSoundRef.current = sound;
  }, []);

  useEffect(() => {
    const unsubTyping = socket.on("typing", (data) => {
      setChatTyping(data.chat_id, data.is_typing);
    });

    const unsubMsg = socket.on("new_message", (data) => {
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

    const unsubRead = socket.on("read", (data) => {
      markChatLastMessageRead(data.chat_id, data.message_ids);
    });

    const unsubUnread = socket.on("unread_count", (data) => {
      syncUnreadCount(data.chat_id, data.unread_count);
    });

    const unsubNewChat = socket.on("new_chat", (data) => {
      prependChat(data.chat);
    });

    const unsubKicked = socket.on("kicked", (data) => {
      removeChat(data.chat_id);
    });

    const unsubLeft = socket.on("left_chat", (data) => {
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
