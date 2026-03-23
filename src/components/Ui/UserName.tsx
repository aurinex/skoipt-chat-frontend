import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import type { UserSnapshot } from "../../stores/useUserStore";
import { useResolvedUser } from "../../stores/useUserStore";
import { getUserDisplayName, getUserShortName } from "../../utils/user";

interface UserNameProps extends TypographyProps {
  user?: UserSnapshot | null;
  fallback?: string;
  short?: boolean;
}

const UserName = ({
  user,
  fallback = "Пользователь",
  short = false,
  children,
  ...props
}: UserNameProps) => {
  const resolvedUser = useResolvedUser(user);
  const content = short
    ? getUserShortName(resolvedUser, fallback)
    : getUserDisplayName(resolvedUser, fallback);

  return <Typography {...props}>{children ?? content}</Typography>;
};

export default UserName;
