import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthState = "loading" | "unauthenticated" | "authenticated";

interface AuthContextValue {
  authState: AuthState;
  username: string | null;
  signIn: (name: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  authState: "loading",
  username: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(() => fetchUserAttributes())
      .then((attrs) => {
        setUsername(attrs.given_name ?? attrs.email ?? "usuario");
        setAuthState("authenticated");
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  function signIn(name: string) {
    setUsername(name);
    setAuthState("authenticated");
  }

  function signOut() {
    setUsername(null);
    setAuthState("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ authState, username, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
