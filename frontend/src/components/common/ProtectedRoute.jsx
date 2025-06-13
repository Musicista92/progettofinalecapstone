import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireOrganizer = false,
}) => {
  const {
    user: _user,
    isAuthenticated,
    isAdmin,
    isOrganizer,
    loading,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect to forbidden page if admin access required but user is not admin
    return <Navigate to="/forbidden" replace />;
  }

  if (requireOrganizer && !isOrganizer && !isAdmin) {
    // Redirect to forbidden page if organizer access required but user is neither organizer nor admin
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;
