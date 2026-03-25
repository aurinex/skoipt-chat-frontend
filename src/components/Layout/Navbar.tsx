import { Box, IconButton, Skeleton, useTheme } from "@mui/material";
import { useState } from "react";

import HomeIconCustom from "../../assets/icons/home.svg?react";
import MessageIconCustom from "../../assets/icons/message.svg?react";
import FriendsIconCustom from "../../assets/icons/friends.svg?react";
import SettingsIconCustom from "../../assets/icons/settings.svg?react";
import AppsIconCustom from "../../assets/icons/app.svg?react";
import { useMeQuery } from "../../queries/useMeQuery";
import { useCachedUser } from "../../stores/useUserStore";
import UserAvatar from "../Ui/UserAvatar";
import type { TabKey } from "../../types";
import { AnimatedTabs } from "../Ui/AnimatedTabs";
import { useSettingsStore } from "../../stores/useSettingsStore";
import MySettingsModal from "../Ui/MySettingsModal";
import { useResponsive } from "../../hooks/useResponsive";

interface NavbarProps {
  orientation?: "vertical" | "horizontal";
  value: TabKey;
  onChange: (value: TabKey) => void;
}

const navItems = [
  { key: "home" as const, content: <HomeIconCustom width={24} height={24} /> },
  {
    key: "messages" as const,
    content: <MessageIconCustom width={24} height={24} />,
  },
  {
    key: "friends" as const,
    content: <FriendsIconCustom width={24} height={24} />,
  },
  { key: "apps" as const, content: <AppsIconCustom width={24} height={24} /> },
];

const Navbar = ({ orientation = "vertical", value, onChange }: NavbarProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const isVertical = orientation === "vertical";
  const { isMobile } = useResponsive();

  const { data: me, isPending: isLoading } = useMeQuery();
  const cachedMe = useCachedUser(me);

  const mode = useSettingsStore((s) => s.navbarMode);
  const [openSettings, setOpenSettings] = useState(false);

  const renderNavButton = (
    item: { key: TabKey; content: React.ReactNode },
    isActive: boolean,
  ) => (
    <IconButton
      onClick={() => onChange(item.key)}
      sx={{
        flex: isVertical ? "unset" : 1,
        minWidth: 0,
        py: isVertical ? undefined : isMobile ? 1.1 : 1.25,
        color: isActive ? "#fff" : colors.wb,
        bgcolor: isActive ? colors.eighth : "transparent",
        borderRadius: isVertical ? "12px" : "16px",
        "&:hover": {
          bgcolor: isActive ? colors.eighth : colors.fourth,
          color: isActive ? "#fff" : colors.eighth,
        },
      }}
    >
      {item.content}
    </IconButton>
  );

  return (
    <Box
      sx={{
        width: isVertical ? 70 : "100%",
        height: isVertical ? "100%" : 72,
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        py: isVertical ? 1 : 0,
        px: isVertical ? 0 : 1,
        bgcolor: colors.fourth,
        borderRadius: "22px",
      }}
    >
      {isVertical ? (
        <AnimatedTabs
          mode={mode}
          items={navItems}
          value={value}
          onChange={onChange}
          renderItem={(item, isActive) => renderNavButton(item, isActive)}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.5,
            width: "100%",
          }}
        >
          {navItems.map((item) => renderNavButton(item, value === item.key))}
        </Box>
      )}

      {isVertical && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isLoading ? (
            <>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={55} height={55} />
            </>
          ) : (
            <>
              <IconButton
                sx={{ color: colors.wb }}
                onClick={() => setOpenSettings(true)}
              >
                <SettingsIconCustom width={24} height={24} />
              </IconButton>

              <UserAvatar
                user={cachedMe}
                fallback="?"
                sx={{
                  width: 55,
                  height: 55,
                  border: `2px solid ${colors.fourth}`,
                  borderRadius: "20px",
                }}
              />
            </>
          )}
        </Box>
      )}

      <MySettingsModal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
      />
    </Box>
  );
};

export default Navbar;
