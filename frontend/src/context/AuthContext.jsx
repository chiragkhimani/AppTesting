import { createContext, useContext, useEffect, useState } from "react";
import { setToken as persistToken } from "../api/client";

const AuthContext = createContext(null);
const USER_KEY = "qa_demo_user";
const TOKEN_KEY = "qa_demo_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (raw && token) setUser(JSON.parse(raw));
    } catch (_) {}
    setReady(true);
  }, []);

  const login = (token, u) => {
    persistToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    persistToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("qa_demo_cart");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
