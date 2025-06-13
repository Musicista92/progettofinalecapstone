import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} from "../utils/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);

// Protected routes
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, validateProfileUpdate, updateProfile);
router.put(
  "/change-password",
  authenticate,
  validatePasswordChange,
  changePassword
);

export default router;
