import { useEffect, useRef } from "react";

interface UseBlinkingTitleParams {
  unreadCount: number;
  defaultTitle?: string;
  interval?: number;
}

export const useBlinkingTitle = ({
  unreadCount,
  defaultTitle = "Мессенджер",
  interval = 2000,
}: UseBlinkingTitleParams) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const formattedCount = unreadCount > 9 ? "9+" : String(unreadCount);
    const unreadTitle =
      unreadCount > 0 ? `${formattedCount} новых сообщений!` : defaultTitle;

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (unreadCount <= 0) {
      document.title = defaultTitle;
      return;
    }

    let showUnread = true;
    document.title = unreadTitle;

    intervalRef.current = window.setInterval(() => {
      document.title = showUnread ? defaultTitle : unreadTitle;
      showUnread = !showUnread;
    }, interval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      document.title = defaultTitle;
    };
  }, [unreadCount, defaultTitle, interval]);
};
