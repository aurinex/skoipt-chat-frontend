import { Box, Typography, useTheme } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { socket, getMyId } from "../../services/api";
import Navbar from "./Navbar";
import ChatList from "../Chat/ChatList";
import { useChatListCacheActions } from "../../queries/chatListCache";
import MiniAppsList from "../MiniApps/MiniAppsList";
import type { TabKey } from "../../types/index";
import { useResponsive } from "../../hooks/useResponsive";

const Layout = () => {
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const theme = useTheme();
  const colors = theme.palette.background;
  const activeTab: TabKey = location.pathname.startsWith("/miniapps")
    ? "apps"
    : "messages";

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

  const handleTabChange = (value: TabKey) => {
    if (value === "apps") {
      navigate("/miniapps");
      return;
    }

    if (value === "messages") {
      navigate("/");
    }
  };

  const showMobileChat = isMobile && location.pathname.startsWith("/chat/");
  const showMobileMiniApp =
    isMobile && location.pathname.startsWith("/miniapps/");
  const showSidebar = !isMobile || (!showMobileChat && !showMobileMiniApp);
  const showOutlet = !isMobile || showMobileChat || showMobileMiniApp;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: "100vh",
        overflow: "hidden",
        animation: "softFadeIn var(--motion-slow) var(--motion-soft)",
      }}
    >
      {!isMobile && (
        <Box
          sx={{
            padding: "30px 0 30px 25px",
            animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
          }}
        >
          <Navbar
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
          />
        </Box>
      )}

      {showSidebar && (
        <Box
          sx={{
            px: isMobile ? 2 : 4.5,
            pt: isMobile ? 2 : 3.75,
            pb: 0,
            width: isMobile ? "100%" : "auto",
            flexGrow: isMobile ? 1 : 0,
            minHeight: 0,
            animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
            animationDelay: "70ms",
            animationFillMode: "both",
          }}
        >
          {activeTab === "messages" && <ChatList />}
          {activeTab === "apps" && <MiniAppsList />}
          {activeTab !== "messages" && activeTab !== "apps" && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.fiveth,
              }}
            >
              <Typography>
                {
                  "\u0420\u0430\u0437\u0434\u0435\u043b \u043f\u043e\u043a\u0430 \u043d\u0435 \u0430\u0434\u0430\u043f\u0442\u0438\u0440\u043e\u0432\u0430\u043d"
                }
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {showOutlet && (
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            minHeight: 0,
            animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
            animationDelay: "120ms",
            animationFillMode: "both",
          }}
        >
          <Outlet />
        </Box>
      )}

      {isMobile && !location.pathname.startsWith("/chat/") && (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            px: 2,
            pb: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            pt: 1,
            bgcolor: "transparent",
            pointerEvents: "none",
            animation: "softFadeUp var(--motion-slow) var(--motion-spring)",
          }}
        >
          <Box sx={{ pointerEvents: "auto" }}>
            <Navbar
              orientation="horizontal"
              value={activeTab}
              onChange={handleTabChange}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Layout;
