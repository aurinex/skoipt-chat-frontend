import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ActiveChat from "./components/ActiveChat";

// Читаем chatId из params и передаём как key —
// React полностью пересоздаёт ActiveChat при каждой смене чата
const KeyedActiveChat = () => {
  const { chatId } = useParams();
  return <ActiveChat key={chatId ?? "new"} />;
};

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
              <Route path="chat/new" element={<KeyedActiveChat />} />
              <Route path="chat/:chatId" element={<KeyedActiveChat />} />
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
