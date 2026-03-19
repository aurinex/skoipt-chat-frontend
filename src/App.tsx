import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage'; // Создай пустую страницу для теста

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#2196f3' } },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Публичные роуты */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Регистрация</div>} />

          {/* Защищенные роуты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<div>Выберите чат, чтобы начать общение</div>} />
              <Route path="chat/:chatId" element={<ChatPage />} />
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