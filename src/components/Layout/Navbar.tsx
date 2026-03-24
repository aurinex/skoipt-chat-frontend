import { Box, IconButton, useTheme, Skeleton } from "@mui/material";
import ThemeSwitcher from "./ThemeSwitcher";

import HomeIconCustom from "../../assets/icons/home.svg?react";
import MessageIconCustom from "../../assets/icons/message.svg?react";
import FriendsIconCustom from "../../assets/icons/friends.svg?react";
import SettingsIconCustom from "../../assets/icons/settings.svg?react";
import AppsIconCustom from "../../assets/icons/app.svg?react";
import { useMeQuery } from "../../queries/useMeQuery";
import { useEffect, useRef, useState } from "react";
import { useCachedUser } from "../../stores/useUserStore";
import UserAvatar from "../Ui/UserAvatar";
import type { TabKey } from "../../types";
import { AnimatedTabs } from "../Ui/AnimatedTabs";
import { useSettingsStore } from "../../stores/useSettingsStore";
import MySettingsModal from "../Ui/MySettingsModal";

interface NavbarProps {
  orientation?: "vertical" | "horizontal";
  value: TabKey;
  onChange: (value: TabKey) => void;
}

const Navbar = ({ orientation = "vertical", value, onChange }: NavbarProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const isVertical = orientation === "vertical";

  const { data: me, isPending: isLoading } = useMeQuery();
  const cachedMe = useCachedUser(me);

  const mode = useSettingsStore((s) => s.navbarMode);

  const [openSettings, setOpenSettings] = useState(false);

  // ── Layout styles ─────────────────────────────────────────
  const containerStyles = {
    width: isVertical ? 70 : "100%",
    height: isVertical ? "100%" : 70,
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    py: isVertical ? 2 : 0,
    px: isVertical ? 0 : 2,
    bgcolor: colors.fourth,
    borderRadius: "22px",
  };

  const groupStyles = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <Box sx={containerStyles}>
      <AnimatedTabs
        mode={mode}
        items={[
          { key: "home", content: <HomeIconCustom width={24} height={24} /> },
          {
            key: "messages",
            content: <MessageIconCustom width={24} height={24} />,
          },
          {
            key: "friends",
            content: <FriendsIconCustom width={24} height={24} />,
          },
          { key: "apps", content: <AppsIconCustom width={24} height={24} /> },
        ]}
        value={value}
        onChange={onChange}
        renderItem={(item, isActive) => (
          <IconButton
            sx={{
              color: isActive ? "#fff" : colors.wb,
              bgcolor: isActive ? colors.eighth : "transparent",
              borderRadius: "12px",

              "&:hover": {
                bgcolor: isActive ? colors.eighth : colors.fourth,
                color: isActive ? "#fff" : colors.eighth,
              },
            }}
          >
            {item.content}
          </IconButton>
        )}
      />

      {/* ── Низ ───────────────────────────────────────── */}
      <Box sx={groupStyles}>
        {isLoading ? (
          <>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton variant="circular" width={55} height={55} />
          </>
        ) : (
          <>
            <ThemeSwitcher orientation="vertical" />

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
              }}
            />
          </>
        )}
      </Box>
      <MySettingsModal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
      />
    </Box>
  );
};

export default Navbar;
