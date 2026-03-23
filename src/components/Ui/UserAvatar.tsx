import { Avatar } from "@mui/material";
import type { AvatarProps } from "@mui/material";
import type { User } from "../../types";
import { useUserStore } from "../../stores/useUserStore";
import { getUserAvatarUrl, getUserInitial, resolveUser } from "../../utils/user";

interface UserAvatarProps extends Omit<AvatarProps, "src"> {
  user?: Partial<User> | null;
  fallback?: string;
}

const UserAvatar = ({ user, fallback = "?", children, ...props }: UserAvatarProps) => {
  const usersById = useUserStore((state) => state.usersById);
  const resolvedUser = resolveUser(user, usersById);

  return (
    <Avatar src={getUserAvatarUrl(resolvedUser)} {...props}>
      {children ?? getUserInitial(resolvedUser, fallback)}
    </Avatar>
  );
};

export default UserAvatar;
