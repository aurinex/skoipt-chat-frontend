import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage"; // Создай пустую страницу для теста
import ActiveChat from "./components/ActiveChat";
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные роуты */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Регистрация</div>} />

          {/* Защищенные роуты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index />
              <Route path="chat/:chatId" element={<ActiveChat />} />
              <Route path="settings" element={<div>Настройки</div>} />
            </Route>
          </Route>

          {/* Редирект с несуществующих страниц */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
