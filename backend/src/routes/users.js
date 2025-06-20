import express from "express";
import {
  getUsers,
  getUserById,
  followUser,
  getUserFollowers,
  getUserFollowing,
  getUserFavourites,
  getUserSuggestions,
  searchUsers,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/:id", authenticate, getUserById);
router.get("/:id/followers", getUserFollowers);
router.get("/:id/following", getUserFollowing);
router.get("/:id/favourites", getUserFavourites);

// Protected routes
router.get("/suggestions", authenticate, getUserSuggestions);
router.post("/:id/follow", authenticate, followUser);

export default router;