import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";
import { body } from "express-validator";
import { sendBroadcastNotification } from "../controllers/adminController.js";
const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

router.post(
  "/broadcast",
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Titolo richiesto (max 200 caratteri)"),
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Messaggio richiesto (max 500 caratteri)"),
    body("userIds")
      .optional()
      .isArray()
      .withMessage("userIds deve essere un array"),
    body("userIds.*")
      .optional()
      .isMongoId()
      .withMessage("ID utente non valido"),
    body("sendEmail")
      .optional()
      .isBoolean()
      .withMessage("sendEmail deve essere boolean"),
  ],
  sendBroadcastNotification
);

export default router;
