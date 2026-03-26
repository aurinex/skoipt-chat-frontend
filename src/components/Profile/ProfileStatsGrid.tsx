import { Box, Typography } from "@mui/material";
import type { AppColors } from "../../types/theme";

interface ProfileStatsGridProps {
  colors: AppColors;
  stats: Array<{
    label: string;
    value: string;
    accent?: string;
  }>;
}

const ProfileStatsGrid = ({ colors, stats }: ProfileStatsGridProps) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(3, minmax(0, 1fr))",
      },
      gap: 1.5,
    }}
  >
    {stats.map((stat) => (
      <Box
        key={stat.label}
        sx={{
          p: 2,
          borderRadius: "22px",
          border: `1px solid ${colors.fourth}`,
          background: `linear-gradient(180deg, ${colors.second} 0%, ${colors.third} 170%)`,
        }}
      >
        <Typography sx={{ color: colors.fiveth, fontSize: 13 }}>
          {stat.label}
        </Typography>
        <Typography
          sx={{
            color: stat.accent ?? colors.sixth,
            fontSize: 22,
            fontWeight: 700,
            mt: 0.8,
          }}
        >
          {stat.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default ProfileStatsGrid;
