import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { createError } from "./errorHandlers.js";

// Basic authentication - requires valid JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError(401, "Access token required");
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createError(401, "User not found");
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    if (error.status) {
      next(error);
    } else {
      next(createError(401, "Invalid token"));
    }
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError(403, "Insufficient permissions"));
    }

    next();
  };
};

// Specific role checks
export const requireOrganizer = authorize("organizer", "admin");
export const requireAdmin = authorize("admin");