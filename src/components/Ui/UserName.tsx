import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import type { User } from "../../types";
import { useUserStore } from "../../stores/useUserStore";
import { getUserDisplayName, getUserShortName, resolveUser } from "../../utils/user";

interface UserNameProps extends TypographyProps {
  user?: Partial<User> | null;
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
  const usersById = useUserStore((state) => state.usersById);
  const resolvedUser = resolveUser(user, usersById);
  const content = short
    ? getUserShortName(resolvedUser, fallback)
    : getUserDisplayName(resolvedUser, fallback);

  return <Typography {...props}>{children ?? content}</Typography>;
};

export default UserName;
