import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ActiveChat from "./components/Chat/ActiveChat";
import NewChat from "./components/Chat/NewChat";
import MiniAppsPage from "./pages/MiniAppsPage";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Регистрация</div>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index />
              <Route path="chat/new" element={<NewChat />} />
              <Route path="chat/:chatId" element={<ActiveChat />} />
              <Route path="miniapps" element={<MiniAppsPage />} />
              <Route path="settings" element={<div>Настройки</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
