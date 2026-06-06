import { Navigate, useLocation } from "react-router-dom";

const isAuthenticated = () => Boolean(localStorage.getItem("token"));

export function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function RedirectIfAuthed({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function HomeRedirect() {
  return <Navigate to={isAuthenticated() ? "/dashboard" : "/register"} replace />;
}
