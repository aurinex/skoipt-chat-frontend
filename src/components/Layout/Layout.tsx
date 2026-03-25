import { Box, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { socket, getMyId } from "../../services/api";
import Navbar from "./Navbar";
import ChatList from "../Chat/ChatList";
import { useChatListCacheActions } from "../../queries/chatListCache";
import MiniAppsList from "../MiniApps/MiniAppsList";
import { useState } from "react";
import type { TabKey } from "../../types/index";

const Layout = () => {
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("messages");

  const theme = useTheme();
  const colors = theme.palette.background;

  const {
    updateChatFromMessage,
    setChatTyping,
    markChatLastMessageRead,
    syncUnreadCount,
    prependChat,
    removeChat,
  } = useChatListCacheActions();

  useEffect(() => {
    const sound = new Audio("/sounds/icq.mp3");
    sound.volume = 0.3;
    notificationSoundRef.current = sound;
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--scrollbar-thumb", colors.fourth);
    root.style.setProperty("--scrollbar-track", "transparent");
  }, [colors]);

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
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        animation: "softFadeIn var(--motion-slow) var(--motion-soft)",
      }}
    >
      <Box
        sx={{
          padding: "30px 0 30px 25px",
          animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
        }}
      >
        <Navbar
          orientation="vertical"
          value={activeTab}
          onChange={setActiveTab}
        />
      </Box>

      <Box
        sx={{
          padding: "30px 36px 0px 36px",
          animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
          animationDelay: "70ms",
          animationFillMode: "both",
        }}
      >
        {activeTab === "messages" && <ChatList />}
        {activeTab === "apps" && <MiniAppsList />}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
          animationDelay: "120ms",
          animationFillMode: "both",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
