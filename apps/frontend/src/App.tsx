import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import "./lib/amplify-config";

type AuthState = "loading" | "unauthenticated" | "authenticated";

function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(() => fetchUserAttributes())
      .then((attrs) => {
        setUsername(attrs.given_name ?? attrs.email ?? null);
        setAuthState("authenticated");
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
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
  }

  if (authState === "unauthenticated") {
    return (
      <LoginPage
        onSignIn={(name) => {
          setUsername(name);
          setAuthState("authenticated");
        }}
      />
    );
  }

  return (
    <Dashboard
      username={username}
      onSignOut={() => {
        setUsername(null);
        setAuthState("unauthenticated");
      }}
    />
  );
}

export default App;
