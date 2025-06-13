import express from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleParticipation,
  updateEventStatus,
  getMyEvents,
  getJoinedEvents,
  toggleFavourite, // NUOVO
  getFavouriteEvents, // NUOVO
} from "../controllers/eventController.js";
import {
  authenticate,
  requireOrganizer,
  requireAdmin,
} from "../middleware/auth.js";
import { validateEvent, validateEventStatus } from "../utils/validation.js";
import { eventImageUploader } from "../config/upload.js";

const router = express.Router();

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected routes - General users
router.get("/user/joined", authenticate, getJoinedEvents);
router.get("/user/favourites", authenticate, getFavouriteEvents); // NUOVO
router.post("/:id/participate", authenticate, toggleParticipation);
router.post("/:id/favourite", authenticate, toggleFavourite); // NUOVO

// Protected routes - Organizers/Admins
router.post(
  "/",
  authenticate,
  requireOrganizer,
  eventImageUploader,
  validateEvent,
  createEvent
);
router.get("/organizer/my-events", authenticate, requireOrganizer, getMyEvents);
router.put("/:id", authenticate, requireOrganizer, validateEvent, updateEvent);
router.delete("/:id", authenticate, requireOrganizer, deleteEvent);

// Protected routes - Admin only
router.put(
  "/:id/status",
  authenticate,
  requireAdmin,
  validateEventStatus,
  updateEventStatus
);

export default router;
