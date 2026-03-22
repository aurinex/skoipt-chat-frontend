import { Box, IconButton, Avatar, useTheme, Skeleton } from "@mui/material";
import ThemeSwitcher from "./ThemeSwitcher";
import api from "../services/api";
import { useState, useEffect } from "react";

import homeIcon from "../assets/icons/home.svg";
import messageIcon from "../assets/icons/message.svg";
import friendsIcon from "../assets/icons/friends.svg";
import settingsIcon from "../assets/icons/settings.svg";

interface NavbarProps {
  orientation?: "vertical" | "horizontal";
}

const Navbar = ({ orientation = "vertical" }: NavbarProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const isVertical = orientation === "vertical";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        const userData = await api.auth.getMe();

        if (userData && userData.avatar_url) {
          setAvatarUrl(userData.avatar_url);
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(true);
        console.error("Ошибка при получении данных пользователя:", error);
      }
    };

    fetchUserData();
  }, []);

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
    transition: "all 0.3s ease",
  };

  const groupStyles = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    gap: isVertical ? 3 : 4,
    alignItems: "center",
  };

  const NavIconButton = ({
    children,
    active = false,
  }: {
    children: React.ReactNode;
    active?: boolean;
  }) =>
    isLoading ? (
      <Skeleton
        variant="circular"
        width={40}
        height={40}
        sx={{ bgcolor: colors.fourth, opacity: 0.5 }}
      />
    ) : (
      <IconButton
        sx={{
          color: active ? colors.sixth : colors.fiveth,
          bgcolor: active ? colors.eighth : "transparent",
          borderRadius: "12px",
          "&:hover": {
            bgcolor: active ? colors.eighth : "rgba(255,255,255,0.05)",
            opacity: 0.9,
          },
        }}
      >
        {children}
      </IconButton>
    );

  return (
    <Box sx={containerStyles}>
      {/* Верхняя/Левая группа иконок */}
      {isLoading ? (
        <Box sx={groupStyles}>
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
        </Box>
      ) : (
        <Box sx={groupStyles}>
          <IconButton sx={{ color: colors.fiveth }}>
            <img src={homeIcon} width={24} height={24} />
          </IconButton>
          <IconButton
            sx={{
              color: colors.sixth,
              bgcolor: colors.eighth,
              borderRadius: "12px",
              "&:hover": { bgcolor: colors.eighth, opacity: 0.9 },
            }}
          >
            <img src={messageIcon} width={24} height={24} />
          </IconButton>
          <IconButton sx={{ color: colors.fiveth }}>
            <img src={friendsIcon} width={24} height={24} />
          </IconButton>
        </Box>
      )}

      {/* Нижняя/Правая группа (Настройки и Аватар) */}
      <Box sx={groupStyles}>
        {isLoading ? (
          <>
            <Box sx={groupStyles}>
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="circular"
                  animation="wave"
                  width={24}
                  height={24}
                  sx={{ bgcolor: colors.skeleton }}
                />
              ))}
            </Box>

            <Skeleton
              variant="circular"
              animation="wave"
              width={36}
              height={36}
              sx={{ bgcolor: colors.skeleton }}
            />

            <Skeleton
              variant="circular"
              animation="wave"
              width={55}
              height={55}
              sx={{ bgcolor: colors.skeleton, mb: isVertical ? 1 : 0 }}
            />
          </>
        ) : (
          <>
            <ThemeSwitcher orientation="vertical" />

            <IconButton sx={{ color: colors.fiveth }}>
              <img src={settingsIcon} width={24} height={24} />
            </IconButton>

            <Avatar
              src={avatarUrl || "/default-avatar.png"}
              sx={{
                width: 55,
                height: 55,
                cursor: "pointer",
                border: `2px solid ${colors.fourth}`,
                mb: isVertical ? 1 : 0,
                ml: isVertical ? 0 : 1,
              }}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default Navbar;
