import { useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputBase,
  MenuItem,
  Select,
  Typography,
  useTheme,
  type SelectChangeEvent,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ProfileHero from "../components/Profile/ProfileHero";
import ProfileInfoCard from "../components/Profile/ProfileInfoCard";
import ProfileStatsGrid from "../components/Profile/ProfileStatsGrid";
import { useResponsive } from "../hooks/useResponsive";
import { queryKeys } from "../lib/queryKeys";
import { useMeQuery } from "../queries/useMeQuery";
import { useSpecialtiesQuery } from "../queries/useSpecialtiesQuery";
import api from "../services/api";
import { upsertUser } from "../stores/useUserStore";
import type { User } from "../types";
import { getSpecialtyByGroup } from "../utils/specialties";
import { getPrimaryUserRole, getUserRoles } from "../utils/user";

interface ProfileFormValues {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  course: string;
  group: string;
}

const getDisplayValue = (
  value: string | number | null | undefined,
  fallback = "Не указано",
) => (value === null || value === undefined || value === "" ? fallback : String(value));

const buildInitialValues = (user: User): ProfileFormValues => ({
  username: user.username ?? "",
  email: user.email ?? "",
  first_name: user.first_name ?? "",
  last_name: user.last_name ?? "",
  course: user.course ? String(user.course) : "",
  group: user.group ?? "",
});

const formatJoinedDate = (value?: string | null) => {
  if (!value) return "Не указано";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const colors = theme.palette.background;
  const { isMobile } = useResponsive();
  const { data: me, isPending } = useMeQuery();
  const { data: specialties = [] } = useSpecialtiesQuery();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileFormValues | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateProfileCache = (nextUser: User) => {
    queryClient.setQueryData(queryKeys.auth.me, nextUser);
    upsertUser(nextUser);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !me) return;

    setIsUploadingAvatar(true);

    try {
      const response = await api.files.uploadAvatar(file);
      updateProfileCache({
        ...me,
        avatar_url: response.url,
      });
    } catch (error) {
      console.error("Не удалось обновить аватар", error);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isPending || !me) {
    return (
      <Box
        sx={{
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.fiveth,
        }}
      >
        <CircularProgress sx={{ color: colors.eighth }} />
      </Box>
    );
  }

  const roles = getUserRoles(me);
  const primaryRole = getPrimaryUserRole(me);
  const currentDraft = draft ?? buildInitialValues(me);
  const derivedSpecialty = getSpecialtyByGroup(currentDraft.group, specialties);
  const currentSpecialty = derivedSpecialty?.specialty ?? "";
  const currentSpecialtyCode = derivedSpecialty?.code ?? "";
  const savedSpecialty =
    getSpecialtyByGroup(me.group, specialties)?.specialty ?? me.specialty;
  const savedSpecialtyCode =
    getSpecialtyByGroup(me.group, specialties)?.code ?? me.specialty_code;

  const handleEditStart = () => {
    setDraft(buildInitialValues(me));
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setDraft(buildInitialValues(me));
    setIsEditing(false);
  };

  const handleDraftChange =
    (field: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft((current) => ({
        ...(current ?? buildInitialValues(me)),
        [field]: event.target.value,
      }));
    };

  const handleSelectChange =
    (field: keyof ProfileFormValues) => (event: SelectChangeEvent<string>) => {
      setDraft((current) => ({
        ...(current ?? buildInitialValues(me)),
        [field]: event.target.value,
      }));
    };

  const handleProfileSave = async (values: ProfileFormValues) => {
    if (isSavingProfile) return;

    const matchedSpecialty = getSpecialtyByGroup(values.group, specialties);

    setIsSavingProfile(true);

    try {
      const updatedUser = await api.users.updateMe({
        username: values.username.trim(),
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        course: values.course ? Number(values.course) : null,
        group: values.group.trim() || null,
        specialty: matchedSpecialty?.specialty ?? null,
        specialty_code: matchedSpecialty?.code ?? null,
      });

      updateProfileCache(updatedUser);
      setDraft(buildInitialValues(updatedUser));
      setIsEditing(false);
    } catch (error) {
      console.error("Не удалось сохранить профиль", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderInlineField = (
    field: keyof ProfileFormValues,
    label: string,
    options?: {
      type?: string;
      select?: boolean;
      menuItems?: Array<{ value: string; label: string }>;
    },
  ) => (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {options?.select ? (
        <Select
          fullWidth
          variant="standard"
          value={currentDraft[field]}
          onChange={handleSelectChange(field)}
          disableUnderline
          displayEmpty
          renderValue={(value) => {
            const selected = options.menuItems?.find((item) => item.value === value);
            return selected?.label ?? label;
          }}
          sx={{
            minWidth: 0,
            color: colors.sixth,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.3,
            "& .MuiSelect-select": {
              p: 0,
              minHeight: "unset",
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            },
            "& .MuiSelect-icon": {
              color: colors.fiveth,
              right: -2,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                mt: 1,
                borderRadius: "16px",
                bgcolor: colors.second,
                color: colors.sixth,
                border: `1px solid ${colors.fourth}`,
                boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
              },
            },
          }}
        >
          {options.menuItems?.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <InputBase
          fullWidth
          type={options?.type}
          value={currentDraft[field]}
          onChange={handleDraftChange(field)}
          placeholder={label}
          sx={{
            minWidth: 0,
            color: colors.sixth,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.3,
            "& input": {
              p: 0,
              textAlign: "right",
              "&::placeholder": {
                color: colors.fiveth,
                opacity: 0.7,
              },
            },
          }}
        />
      )}
    </Box>
  );

  const profileItems = [
    {
      label: "Имя",
      value: isEditing
        ? renderInlineField("first_name", "Имя")
        : getDisplayValue(me.first_name),
      isEditing,
    },
    {
      label: "Фамилия",
      value: isEditing
        ? renderInlineField("last_name", "Фамилия")
        : getDisplayValue(me.last_name),
      isEditing,
    },
    {
      label: "Логин",
      value: isEditing
        ? renderInlineField("username", "Логин")
        : `@${me.username}`,
      isEditing,
    },
    {
      label: "Email",
      value: isEditing
        ? renderInlineField("email", "Email", { type: "email" })
        : getDisplayValue(me.email),
      isEditing,
    },
    {
      label: "Роли",
      value: roles.length ? roles.join(", ") : "Не указано",
    },
  ];

  const educationItems = [
    {
      label: "Группа",
      value: isEditing
        ? renderInlineField("group", "Группа")
        : getDisplayValue(me.group),
      isEditing,
    },
    {
      label: "Курс",
      value: isEditing
        ? renderInlineField("course", "Курс", {
            select: true,
            menuItems: [
              { value: "", label: "Не указан" },
              { value: "1", label: "1 курс" },
              { value: "2", label: "2 курс" },
              { value: "3", label: "3 курс" },
              { value: "4", label: "4 курс" },
            ],
          })
        : getDisplayValue(me.course),
      isEditing,
    },
    {
      label: "Специальность",
      value: getDisplayValue(
        isEditing ? currentSpecialty : savedSpecialty,
        "Не удалось определить по группе",
      ),
    },
    {
      label: "Код",
      value: getDisplayValue(
        isEditing ? currentSpecialtyCode : savedSpecialtyCode,
        "Не удалось определить",
      ),
    },
    {
      label: "Статус",
      value: me.is_online ? "В сети" : "Не в сети",
    },
  ];

  const stats = [
    {
      label: "Главная роль",
      value: getDisplayValue(primaryRole, "user"),
      accent: colors.eighth,
    },
    {
      label: "Всего ролей",
      value: String(roles.length || 0),
    },
    {
      label: "Курс",
      value: getDisplayValue(me.course, "—"),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100%",
        overflowY: "auto",
        px: isMobile ? 2 : 4,
        py: isMobile ? 2 : 3,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleAvatarUpload}
      />

      <Box
        sx={{
          maxWidth: 980,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          animation: "softFadeIn var(--motion-slow) var(--motion-soft)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: "16px",
              textTransform: "none",
              bgcolor: colors.fourth,
              color: colors.sixth,
              px: 1.8,
              py: 1.1,
            }}
          >
            Назад
          </Button>

          <Button
            startIcon={<UploadFileRoundedIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            sx={{
              borderRadius: "16px",
              textTransform: "none",
              bgcolor: colors.eighth,
              color: "#fff",
              px: 1.8,
              py: 1.1,
              "&:hover": {
                bgcolor: colors.eighth,
              },
            }}
          >
            {isUploadingAvatar ? "Загружаем..." : "Обновить аватар"}
          </Button>
        </Box>

        <ProfileHero
          user={me}
          colors={colors}
          isMobile={isMobile}
          isUploadingAvatar={isUploadingAvatar}
          onUploadClick={() => fileInputRef.current?.click()}
          onEditClick={isEditing ? handleEditCancel : handleEditStart}
        />

        <ProfileStatsGrid colors={colors} stats={stats} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <ProfileInfoCard
            title="Основная информация"
            items={profileItems}
            colors={colors}
            footer={
              isEditing ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <Button
                    onClick={handleEditCancel}
                    sx={{
                      borderRadius: "16px",
                      textTransform: "none",
                      bgcolor: colors.third,
                      color: colors.sixth,
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={() => void handleProfileSave(currentDraft)}
                    disabled={isSavingProfile}
                    sx={{
                      borderRadius: "16px",
                      textTransform: "none",
                      bgcolor: colors.eighth,
                      color: "#fff",
                      "&:hover": {
                        bgcolor: colors.eighth,
                      },
                    }}
                  >
                    {isSavingProfile ? "Сохраняем..." : "Сохранить"}
                  </Button>
                </Box>
              ) : null
            }
          />
          <ProfileInfoCard
            title="Учебный профиль"
            items={educationItems}
            colors={colors}
          />
        </Box>

        <Box
          sx={{
            p: 2.4,
            borderRadius: "24px",
            border: `1px solid ${colors.fourth}`,
            background: `linear-gradient(180deg, ${colors.second} 0%, ${colors.third} 160%)`,
          }}
        >
          <Typography
            sx={{
              color: colors.sixth,
              fontSize: 18,
              fontWeight: 700,
              mb: 0.8,
            }}
          >
            О профиле
          </Typography>
          <Typography
            sx={{
              color: colors.fiveth,
              fontSize: 14,
              lineHeight: 1.65,
              maxWidth: 720,
            }}
          >
            Специальность и код теперь определяются по префиксу группы. Если
            меняется группа, карточка учебного профиля сразу показывает, к какой
            специальности она относится.
          </Typography>

          <Typography
            sx={{
              color: colors.fiveth,
              fontSize: 13,
              mt: 1.25,
            }}
          >
            Дата регистрации: {formatJoinedDate(me.created_at)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
