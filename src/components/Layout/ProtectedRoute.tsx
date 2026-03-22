import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { socket } from "../../services/api";

const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (token) {
      socket.connect();
    }
    // При размонтировании (например, логаут) закрываем соединение
    return () => socket.disconnect();
  }, [token]);

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
