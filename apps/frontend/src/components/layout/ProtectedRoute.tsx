import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

const loadingSpinner = (
  <div className="flex items-center justify-center min-h-screen bg-canvas">
    <svg
      className="animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      width="32"
      height="32"
    >
      <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0110 10"
        stroke="gold"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export function ProtectedRoute() {
  const { authState } = useAuth();

  if (authState === "loading") return loadingSpinner;
  if (authState === "unauthenticated") return <Navigate to="/login" replace />;
  return <Outlet />;
}
