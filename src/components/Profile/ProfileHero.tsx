import { Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import type { User } from "../../types";
import type { AppColors } from "../../types/theme";
import UserAvatar from "../Ui/UserAvatar";
import { getUserRoles } from "../../utils/user";

interface ProfileHeroProps {
  user: User;
  colors: AppColors;
  isMobile: boolean;
  isUploadingAvatar: boolean;
  onUploadClick: () => void;
  onEditClick: () => void;
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin":
      return "Администратор";
    case "teacher":
      return "Преподаватель";
    case "student":
      return "Студент";
    default:
      return role ?? "Пользователь";
  }
};

const ProfileHero = ({
  user,
  colors,
  isMobile,
  isUploadingAvatar,
  onUploadClick,
  onEditClick,
}: ProfileHeroProps) => {
  const fullName =
    user.full_name?.trim() ||
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
    user.username;
  const roles = getUserRoles(user);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        p: isMobile ? 2.5 : 3,
        border: `1px solid ${colors.fourth}`,
        background: `radial-gradient(circle at top left, ${colors.eighth}26, transparent 36%), linear-gradient(145deg, ${colors.second} 0%, ${colors.third} 130%)`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 2.5,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <UserAvatar
            user={user}
            fallback="?"
            sx={{
              width: isMobile ? 96 : 122,
              height: isMobile ? 96 : 122,
              fontSize: isMobile ? "2rem" : "2.6rem",
              borderRadius: "30px",
              border: `3px solid ${colors.fourth}`,
              boxShadow: "0 18px 34px rgba(0,0,0,0.2)",
            }}
          />

          <Button
            onClick={onUploadClick}
            disabled={isUploadingAvatar}
            sx={{
              position: "absolute",
              right: -10,
              bottom: -10,
              minWidth: 0,
              width: 44,
              height: 44,
              borderRadius: "14px",
              bgcolor: colors.eighth,
              color: "#fff",
              boxShadow: "0 14px 28px rgba(0, 80, 228, 0.28)",
              "&:hover": {
                bgcolor: colors.eighth,
                transform: "translateY(-1px)",
              },
            }}
          >
            {isUploadingAvatar ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              <CameraAltRoundedIcon sx={{ fontSize: 20 }} />
            )}
          </Button>
        </Box>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: colors.sixth,
                fontSize: isMobile ? 28 : 36,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              {fullName}
            </Typography>

            <IconButton
              onClick={onEditClick}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "14px",
                color: colors.sixth,
                bgcolor: "rgba(255,255,255,0.08)",
                border: "1px solid transparent",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.14)",
                  borderColor: colors.eighth,
                  color: colors.eighth,
                },
              }}
            >
              <EditRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Typography
            sx={{
              color: colors.fiveth,
              fontSize: 15,
              mt: 0.75,
            }}
          >
            @{user.username}
          </Typography>

          <Box
            sx={{
              mt: 1.6,
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {roles.map((role) => (
              <Box
                key={role}
                sx={{
                  px: 1.4,
                  py: 0.8,
                  borderRadius: "999px",
                  bgcolor: `${colors.eighth}20`,
                  color: colors.eighth,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {getRoleLabel(role)}
              </Box>
            ))}

            <Box
              sx={{
                px: 1.4,
                py: 0.8,
                borderRadius: "999px",
                bgcolor: user.is_online ? "#2ea04322" : `${colors.fiveth}1f`,
                color: user.is_online ? "#2ea043" : colors.fiveth,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {user.is_online ? "В сети" : "Не в сети"}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHero;
