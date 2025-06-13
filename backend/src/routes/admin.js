import express from "express";
import {
  getDashboardStats,
  getEventsByMonth,
  getUserGrowth,
  getPendingEvents,
  bulkApproveEvents,
  getSystemHealth,
  getPopularContent,
  sendBroadcastNotification,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/adminController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { body } from "express-validator";

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard analytics
router.get("/stats", getDashboardStats);
router.get("/events-by-month", getEventsByMonth);
router.get("/user-growth", getUserGrowth);
router.get("/system-health", getSystemHealth);
router.get("/popular-content", getPopularContent);

// Event management
router.get("/pending-events", getPendingEvents);
router.post(
  "/events/bulk-approve",
  [
    body("eventIds").isArray({ min: 1 }).withMessage("Lista eventi richiesta"),
    body("eventIds.*").isMongoId().withMessage("ID evento non valido"),
  ],
  bulkApproveEvents
);

router.put("/users/:id", updateUserByAdmin);
router.delete("/users/:id", deleteUserByAdmin);

export default router;
