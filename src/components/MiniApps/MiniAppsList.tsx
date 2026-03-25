import { Box, Typography, useTheme, CircularProgress } from "@mui/material";
import { useMiniAppsQuery } from "../../queries/useMiniAppsQuery";
import { useNavigate } from "react-router-dom";
import type { MiniApps } from "../../types/index";
import { useResponsive } from "../../hooks/useResponsive";

const MiniAppsList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = theme.palette.background;
  const { isMobile } = useResponsive();

  const { data: apps = [], isLoading } = useMiniAppsQuery();

  const handleOpen = (app: MiniApps) => {
    navigate(`/miniapps/${app.id}`);
  };

  return (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.sixth,
              fontSize: isMobile ? 28 : 36,
            }}
          >
            {"\u041c\u0438\u043d\u0438-\u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {isLoading && <CircularProgress size={24} />}

        {apps.map((app) => (
          <Box
            key={app.id}
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: colors.third,
              mb: 1,
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
            }}
            onClick={() => handleOpen(app)}
          >
            <Typography sx={{ color: colors.sixth }}>{app.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MiniAppsList;
