import { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "@mui/material";
import AppTextField from "../components/Ui/AppTextField";

const LoginPage = () => {
  const theme = useTheme();

  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.login(form);
      navigate("/");
    } catch (err: unknown) {
      console.error("Ошибка входа:", err);
    }
  };

  const input = {
    ".MuiOutlinedInput-root": {
      color: theme.palette.background.fiveth,
      borderRadius: "20px",
      fontSize: "20px",
      height: "49px",
    },
    ".MuiOutlinedInput-input": {
      padding: "19px 22px",
    },
    ".MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    bgcolor: theme.palette.background.fourth,
    border: "none",
    borderRadius: "20px",
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "590px",
          // height: "287px",
          borderRadius: "55px",
          bgcolor: theme.palette.background.third,
        }}
      >
        <Box
          sx={{
            padding: "54px 62px",
          }}
        >
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Box>
                {/* <Typography
                  sx={{
                    color: theme.palette.background.wb,
                    fontSize: "20px",
                    marginLeft: "12px",
                  }}
                >
                  Логин<span style={{ color: "#FA3B3B" }}>*</span>
                </Typography> */}
                <AppTextField
                  label="Логин"
                  required
                  placeholder="aurinex"
                  value={form.username}
                  onChange={(value) => setForm({ ...form, username: value })}
                />
                {/* <TextField
                  placeholder="aurinex"
                  fullWidth
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  sx={{
                    ...input,
                  }}
                /> */}
              </Box>

              <Box>
                {/* <Typography
                  sx={{
                    color: theme.palette.background.wb,
                    fontSize: "20px",
                    marginLeft: "12px",
                  }}
                >
                  Пароль<span style={{ color: "#FA3B3B" }}>*</span>
                </Typography> */}
                <AppTextField
                  label="Пароль"
                  required
                  type="password"
                  placeholder="******"
                  value={form.password}
                  onChange={(value) => setForm({ ...form, password: value })}
                />
                {/* <TextField
                  type="password"
                  placeholder="******"
                  fullWidth
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  sx={{
                    ...input,
                    ".MuiOutlinedInput-root": {
                      color: theme.palette.background.fiveth,
                      borderRadius: "20px",
                      fontSize: "16px",
                      height: "49px",
                    },
                  }}
                /> */}
              </Box>
              <Box>
                <Button
                  type="submit"
                  sx={{
                    width: "50%",
                    height: "49px",
                    bgcolor: theme.palette.background.fourth,
                    borderRadius: "20px",
                    color: theme.palette.background.wb,
                    textTransform: "none",
                    fontSize: "20px",
                    mt: "30px",
                    ml: "50%",
                  }}
                >
                  Войти
                </Button>
              </Box>
            </Box>
          </form>
        </Box>
      </Box>
      {/* <Paper sx={{ p: 4, width: 400 }}>
        <Typography>Вход 1231231тест</Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Логин"
            margin="normal"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            margin="normal"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
            Войти
          </Button>
        </form>
      </Paper> */}
    </Box>
  );
};

export default LoginPage;
