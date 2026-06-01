import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/items/pages/Dashboard";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
    {
        path:"/register",
        element:<Register/> 
    },
  {
    path: "/login",
    element:<Login/>
  },
  {
    path: "/",
    element: <Dashboard />,
  },
]);
