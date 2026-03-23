import { Box, Typography } from "@mui/material";
import type { BoxProps, TypographyProps } from "@mui/material";
import type { TypingUser, User } from "../../types";
import { useResolvedUser } from "../../stores/useUserStore";
import { getTypingStatusText, getUserPresenceText } from "../../utils/user";

interface UserStatusProps extends Omit<TypographyProps, "children"> {
  user?: Partial<User> | null;
  typingUsers?: TypingUser[];
  indicatorOnly?: boolean;
  showIndicator?: boolean;
  indicatorSx?: BoxProps["sx"];
}

const UserStatus = ({
  user,
  typingUsers = [],
  indicatorOnly = false,
  showIndicator = false,
  indicatorSx,
  sx,
  ...props
}: UserStatusProps) => {
  const resolvedUser = useResolvedUser(user);
  const statusText =
    getTypingStatusText(typingUsers) ?? getUserPresenceText(resolvedUser);
  const isActive = typingUsers.length > 0 || Boolean(resolvedUser?.is_online);

  if (indicatorOnly) {
    return isActive ? (
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: "#4caf50",
          ...indicatorSx,
        }}
      />
    ) : null;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: showIndicator ? 0.75 : 0 }}>
      {showIndicator && isActive && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#4caf50",
            flexShrink: 0,
            ...indicatorSx,
          }}
        />
      )}
      <Typography sx={sx} {...props}>
        {statusText}
      </Typography>
    </Box>
  );
};

export default UserStatus;
