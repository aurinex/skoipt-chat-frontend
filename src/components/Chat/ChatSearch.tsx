import { Box, TextField, useTheme } from "@mui/material";
import { useEffect, useRef } from "react";

interface ChatSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const ChatSearch = ({ value, onChange }: ChatSearchProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;

  // Debounce: шлём запрос только после 300мс паузы
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(raw);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: colors.fourth,
        padding: "10px 0px",
        borderRadius: "24px",
      }}
    >
      <TextField
        multiline
        maxRows={1}
        fullWidth
        defaultValue={value}
        placeholder="Поиск"
        variant="standard"
        onChange={handleChange}
        InputProps={{
          disableUnderline: true,
          sx: { color: colors.sixth, px: 2, fontSize: 14 },
        }}
      />
    </Box>
  );
};

export default ChatSearch;
