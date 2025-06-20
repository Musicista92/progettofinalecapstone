import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  genericErrorHandler,
} from "./src/middleware/errorHandlers.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/users.js";
import eventRoutes from "./src/routes/events.js";
import commentRoutes from "./src/routes/comments.js";
import notificationRoutes from "./src/routes/notifications.js";
import adminRoutes from "./src/routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(
  cors()
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.get("/", (req, res) => {
  res.json({
    message: "🎵 Ritmo Events Backend API",
    status: "running",
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ==================== ERROR HANDLERS ====================
app.use(badRequestHandler);
app.use(unauthorizedHandler);
app.use(notfoundHandler);
app.use(genericErrorHandler);

// ==================== DATABASE CONNECTION ====================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });