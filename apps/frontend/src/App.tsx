import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { LoginPage } from "./components/LoginPage";
import "./lib/amplify-config";

type AuthState = "loading" | "unauthenticated" | "authenticated";

function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    getCurrentUser()
      .then(() => setAuthState("authenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0b0f1a",
        }}
      >
        <svg
          style={{ animation: "spin 0.75s linear infinite" }}
          viewBox="0 0 24 24"
          fill="none"
          width="32"
          height="32"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="#1e293b" strokeWidth="3" />
          <path
            d="M12 2a10 10 0 0110 10"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginPage onSignIn={() => setAuthState("authenticated")} />;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0b0f1a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p>✅ Sesión iniciada — Dashboard próximamente</p>
    </div>
  );
}

export default App;
