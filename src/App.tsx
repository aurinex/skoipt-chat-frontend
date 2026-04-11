import { Suspense, lazy } from "react";
import { Box, CircularProgress } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";

const Layout = lazy(() => import("./components/Layout/Layout"));
const ProtectedRoute = lazy(() => import("./components/Layout/ProtectedRoute"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ActiveChat = lazy(() => import("./components/Chat/ActiveChat"));
const NewChat = lazy(() => import("./components/Chat/NewChat"));
const MiniAppsPage = lazy(() => import("./pages/MiniAppsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const RouteFallback = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<div>Регистрация</div>} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index />
                <Route path="chat/new" element={<NewChat />} />
                <Route path="chat/:chatId" element={<ActiveChat />} />
                <Route path="miniapps">
                  <Route index element={<MiniAppsPage />} />
                  <Route path=":appId" element={<MiniAppsPage />} />
                </Route>
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<div>Настройки</div>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
