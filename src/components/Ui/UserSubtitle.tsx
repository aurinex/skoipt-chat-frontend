import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import type { User } from "../../types";
import { useUserStore } from "../../stores/useUserStore";
import { getUserSubtitle, resolveUser } from "../../utils/user";

interface UserSubtitleProps extends TypographyProps {
  user?: Partial<User> | null;
  includeUsername?: boolean;
  includeGroup?: boolean;
  separator?: string;
  fallback?: string;
}

const UserSubtitle = ({
  user,
  includeUsername = true,
  includeGroup = true,
  separator = " · ",
  fallback = "",
  children,
  ...props
}: UserSubtitleProps) => {
  const usersById = useUserStore((state) => state.usersById);
  const resolvedUser = resolveUser(user, usersById);
  const content = getUserSubtitle(resolvedUser, {
    includeUsername,
    includeGroup,
    separator,
    fallback,
  });

  return <Typography {...props}>{children ?? content}</Typography>;
};

export default UserSubtitle;
