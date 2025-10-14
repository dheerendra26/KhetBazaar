import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists in cookies/localStorage for session persistence
    const token = document.cookie.split("; ").find((row) => row.startsWith("token="));
    if (token) setIsAuthenticated(true);
  }, []);

  const login = (token) => {
    document.cookie = `token=${token}; path=/`; // Store token in cookies
    setIsAuthenticated(true);
  };

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
