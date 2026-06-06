import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/items/pages/Dashboard";
import { HomeRedirect, RequireAuth, RedirectIfAuthed } from "../features/auth/RouteGuards";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    path: "/register",
    element: (
      <RedirectIfAuthed>
        <Register />
      </RedirectIfAuthed>
    ),
  },
  {
    path: "/login",
    element: (
      <RedirectIfAuthed>
        <Login />
      </RedirectIfAuthed>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
]);
