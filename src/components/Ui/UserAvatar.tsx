import { Avatar } from "@mui/material";
import type { AvatarProps } from "@mui/material";
import type { UserSnapshot } from "../../stores/useUserStore";
import { useResolvedUser } from "../../stores/useUserStore";
import { getUserAvatarUrl, getUserInitial } from "../../utils/user";

interface UserAvatarProps extends Omit<AvatarProps, "src"> {
  user?: UserSnapshot | null;
  fallback?: string;
}

const UserAvatar = ({ user, fallback = "?", children, ...props }: UserAvatarProps) => {
  const resolvedUser = useResolvedUser(user);

  return (
    <Avatar src={getUserAvatarUrl(resolvedUser)} {...props}>
      {children ?? getUserInitial(resolvedUser, fallback)}
    </Avatar>
  );
};

export default UserAvatar;
