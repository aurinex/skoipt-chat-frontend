import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { formatLocalTime } from "../../utils/chatFormatters";

interface TimeTextProps extends TypographyProps {
  value: string;
}

const TimeText = ({ value, children, ...props }: TimeTextProps) => {
  return <Typography {...props}>{children ?? formatLocalTime(value)}</Typography>;
};

export default TimeText;
