import express from "express";
import {
  getEventComments,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../controllers/commentController.js";
import { authenticate } from "../middleware/auth.js";
import { body } from "express-validator";
import { validateComment, validateCommentUpdate } from "../utils/validation.js";

const router = express.Router();

// Routes for comments on events
router.get("/events/:eventId/comments", getEventComments);
router.post(
  "/events/:eventId/comments",
  authenticate,
  validateComment,
  addComment
);

// Routes for individual comments
router.put("/:id", authenticate, validateCommentUpdate, updateComment);
router.delete("/:id", authenticate, deleteComment);
router.post("/:id/like", authenticate, toggleCommentLike);

export default router;
