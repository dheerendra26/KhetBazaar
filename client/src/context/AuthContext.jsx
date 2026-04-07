import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail]             = useState(null);
  const [userRole, setUserRole]               = useState( localStorage.getItem("role") || null);

  // Rehydrate from localStorage on first mount (handles page refresh)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const role  = localStorage.getItem("role");
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserRole(role);
    }
  }, []);

  /**
   * Call this right after a successful /login API call.
   * Writes localStorage AND updates all three state values in the same
   * synchronous call — React 18 batches them into one re-render, so the
   * Navbar always sees isAuthenticated=true AND userRole together.
   */
  const login = useCallback((token, email, role) => {
    // Persist first so any immediate re-read from localStorage also works
    localStorage.setItem("token",     token);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("role",      role);
    // Single batched state update — all three land in the same render
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
