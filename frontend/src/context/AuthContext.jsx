import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("accessToken") || null);
  const [loading, setLoading] = useState(true);

  // Get current user details if token exists
  const fetchMe = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (err) {
      console.error("Failed to load user profile", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user: loggedUser } = response.data;
      
      localStorage.setItem("accessToken", accessToken);
      setToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid email or password";
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Password change failed";
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
