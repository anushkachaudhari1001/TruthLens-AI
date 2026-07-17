import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tl_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const setAuth = (token, u) => {
    localStorage.setItem("tl_token", token);
    localStorage.setItem("tl_user", JSON.stringify(u));
    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data.token, data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    setAuth(data.token, data.user);
    return data.user;
  };

  const googleAuth = async (sessionId) => {
    const { data } = await api.post("/auth/google", { session_id: sessionId });
    setAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("tl_token");
    localStorage.removeItem("tl_user");
    setUser(null);
  };

  // Handle Google session_id from URL fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#session_id=")) {
      const sessionId = hash.split("=")[1];
      setLoading(true);
      googleAuth(sessionId)
        .then(() => { window.location.hash = ""; window.location.pathname = "/dashboard"; })
        .catch(() => setLoading(false));
    }
  }, []);

  return (
    <AuthCtx.Provider value={{ user, login, register, googleAuth, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
