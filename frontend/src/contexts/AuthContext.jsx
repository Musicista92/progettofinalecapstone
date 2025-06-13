import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiService.auth.getProfile();
        setUser(userData.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Remove invalid token
        localStorage.removeItem("authToken");
        toast.error("Sessione scaduta, effettua nuovamente il login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const data = await apiService.auth.login(credentials);

      setUser(data.user);
      setIsAuthenticated(true);
      toast.success("Login effettuato con successo!");

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "Errore durante il login");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await apiService.auth.register(userData);

      setUser(data.user);
      setIsAuthenticated(true);
      toast.success("Registrazione completata con successo!");

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Errore durante la registrazione");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logout effettuato con successo");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const data = await apiService.auth.updateProfile(profileData);
      setUser(data.user);
      toast.success("Profilo aggiornato con successo!");
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(
        error.message || "Errore durante l'aggiornamento del profilo"
      );
      return { success: false, error: error.message };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      await apiService.auth.changePassword(passwordData);
      toast.success("Password aggiornata con successo!");
      return { success: true };
    } catch (error) {
      console.error("Password change failed:", error);
      toast.error(error.message || "Errore durante il cambio password");
      return { success: false, error: error.message };
    }
  };

  const updateUser = (updates) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updates,
    }));
  };

  // Helper functions for role checking
  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const isUser = user?.role === "user";

  const value = {
    // State
    user,
    loading,
    isAuthenticated,

    // Role checks
    isAdmin,
    isOrganizer,
    isUser,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
