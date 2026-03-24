import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useMiniAppsQuery } from "../../queries/useMiniAppsQuery";
import { useNavigate } from "react-router-dom";
import type { MiniApps } from "../../types/index";

import api from "../../services/api";

const MiniAppsList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = theme.palette.background;

  const { data: apps = [], isLoading } = useMiniAppsQuery();

  const handleOpen = (app: MiniApps) => {
    navigate(`/miniapps/${app.id}`);
  };

  return (
    <Box
      sx={{
        width: 400,
        bgcolor: colors.second,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
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
            sx={{ fontWeight: 700, color: colors.sixth, fontSize: 36 }}
          >
            Мини-приложения
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
