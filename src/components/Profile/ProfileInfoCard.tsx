import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { AppColors } from "../../types/theme";

interface ProfileInfoItem {
  label: string;
  value: ReactNode;
  isEditing?: boolean;
}

interface ProfileInfoCardProps {
  title: string;
  items: ProfileInfoItem[];
  colors: AppColors;
  footer?: ReactNode;
}

const ProfileInfoCard = ({
  title,
  items,
  colors,
  footer,
}: ProfileInfoCardProps) => (
  <Box
    sx={{
      p: 2.25,
      borderRadius: "24px",
      border: `1px solid ${colors.fourth}`,
      bgcolor: colors.second,
      boxShadow: "var(--surface-glow-soft)",
    }}
  >
    <Typography
      sx={{
        color: colors.sixth,
        fontSize: 18,
        fontWeight: 700,
        mb: 1.5,
      }}
    >
      {title}
    </Typography>

    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.15 }}>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            p: 1.4,
            borderRadius: "18px",
            position: "relative",
            overflow: "hidden",
            bgcolor: item.isEditing ? colors.third : colors.fourth,
            transition:
              "background-color var(--motion-medium) var(--motion-soft), transform var(--motion-fast) var(--motion-soft)",
            "&::before": item.isEditing
              ? {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  width: "48%",
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.08) 75%, transparent 100%)",
                  pointerEvents: "none",
                }
              : undefined,
          }}
        >
          <Typography
            sx={{
              position: "relative",
              zIndex: 1,
              color: colors.fiveth,
              fontSize: 13,
              minWidth: 110,
            }}
          >
            {item.label}
          </Typography>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              color: colors.sixth,
              fontSize: 14,
              fontWeight: 600,
              textAlign: "right",
              wordBreak: "break-word",
              minWidth: 0,
              flexGrow: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {typeof item.value === "string" ? (
              <Typography
                sx={{
                  color: colors.sixth,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {item.value}
              </Typography>
            ) : (
              item.value
            )}
          </Box>
        </Box>
      ))}
    </Box>

    {footer && <Box sx={{ mt: 1.5 }}>{footer}</Box>}
  </Box>
);

export default ProfileInfoCard;
