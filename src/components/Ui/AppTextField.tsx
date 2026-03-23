import { TextField, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

interface AppTextFieldProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  InputProps?: TextFieldProps["InputProps"];
  styles?: TextFieldProps["sx"];
  autoFocus?: boolean;
}

const AppTextField = ({
  label,
  required,
  placeholder,
  type = "text",
  value,
  onChange,
  InputProps,
  styles,
  ...rest
}: AppTextFieldProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;

  return (
    <Box>
      {label && (
        <Typography
          sx={{
            color: colors.wb,
            fontSize: "20px",
            marginLeft: "12px",
          }}
        >
          {label}
          {required && <span style={{ color: "#FA3B3B" }}>*</span>}
        </Typography>
      )}

      <TextField
        fullWidth
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        InputProps={InputProps}
        sx={{
          borderRadius: "20px",
          ...styles,
          ".MuiOutlinedInput-root": {
            color: colors.fiveth,
            // borderRadius: "20px",
            fontSize: type === "password" ? "16px" : "18px",
            height: "49px",
          },
          ".MuiOutlinedInput-input": {
            padding: "19px 22px",
          },
          ".MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          bgcolor: colors.fourth,
        }}
        {...rest}
      />
    </Box>
  );
};

export default AppTextField;
