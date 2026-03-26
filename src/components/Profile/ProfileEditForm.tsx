import { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import type { User } from "../../types";
import type { AppColors } from "../../types/theme";

export interface ProfileFormValues {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  course: string;
  group: string;
  specialty: string;
  specialty_code: string;
}

interface ProfileEditFormProps {
  user: User;
  colors: AppColors;
  isSaving: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel?: () => void;
}

const buildInitialValues = (user: User): ProfileFormValues => ({
  username: user.username ?? "",
  email: user.email ?? "",
  first_name: user.first_name ?? "",
  last_name: user.last_name ?? "",
  course: user.course ? String(user.course) : "",
  group: user.group ?? "",
  specialty: user.specialty ?? "",
  specialty_code: user.specialty_code ?? "",
});

const ProfileEditForm = ({
  user,
  colors,
  isSaving,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) => {
  const [values, setValues] = useState<ProfileFormValues>(() =>
    buildInitialValues(user),
  );

  useEffect(() => {
    setValues(buildInitialValues(user));
  }, [user]);

  const handleChange =
    (field: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2.25,
        borderRadius: "24px",
        border: `1px solid ${colors.fourth}`,
        bgcolor: colors.second,
        boxShadow: "var(--surface-glow-soft)",
      }}
    >
      <Typography
        sx={{
          color: colors.sixth,
          fontSize: 18,
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        Редактирование профиля
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        <TextField
          label="Имя"
          value={values.first_name}
          onChange={handleChange("first_name")}
          fullWidth
        />
        <TextField
          label="Фамилия"
          value={values.last_name}
          onChange={handleChange("last_name")}
          fullWidth
        />
        <TextField
          label="Логин"
          value={values.username}
          onChange={handleChange("username")}
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange("email")}
          fullWidth
        />
        <TextField
          label="Курс"
          select
          value={values.course}
          onChange={handleChange("course")}
          fullWidth
        >
          <MenuItem value="">Не указан</MenuItem>
          <MenuItem value="1">1 курс</MenuItem>
          <MenuItem value="2">2 курс</MenuItem>
          <MenuItem value="3">3 курс</MenuItem>
          <MenuItem value="4">4 курс</MenuItem>
        </TextField>
        <TextField
          label="Группа"
          value={values.group}
          onChange={handleChange("group")}
          fullWidth
        />
        <TextField
          label="Специальность"
          value={values.specialty}
          onChange={handleChange("specialty")}
          fullWidth
        />
        <TextField
          label="Код специальности"
          value={values.specialty_code}
          onChange={handleChange("specialty_code")}
          fullWidth
        />
      </Box>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            sx={{
              borderRadius: "16px",
              textTransform: "none",
              bgcolor: colors.third,
              color: colors.sixth,
              px: 2,
              py: 1.1,
            }}
          >
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSaving}
          sx={{
            borderRadius: "16px",
            textTransform: "none",
            bgcolor: colors.eighth,
            color: "#fff",
            px: 2,
            py: 1.1,
            "&:hover": {
              bgcolor: colors.eighth,
            },
          }}
        >
          {isSaving ? "Сохраняем..." : "Сохранить"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProfileEditForm;
