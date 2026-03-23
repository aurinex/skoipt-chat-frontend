import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { formatDateLabel } from "../../utils/chatFormatters";

interface DateLabelProps extends TypographyProps {
  value: string;
}

const DateLabel = ({ value, children, ...props }: DateLabelProps) => {
  return <Typography {...props}>{children ?? formatDateLabel(value)}</Typography>;
};

export default DateLabel;
