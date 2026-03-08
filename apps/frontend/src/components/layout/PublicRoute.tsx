import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export function PublicRoute() {
  const { authState } = useAuth();

  switch (authState) {
    case "loading":
      return null;
    case "authenticated":
      return <Navigate to="/dashboard" replace />;
    case "unauthenticated":
      return <Outlet />;
  }
}
