import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { createError } from "../middleware/errorHandlers.js";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(createError(400, "Solo file immagine sono permessi"), false);
  }
};

// Avatar uploader
export const avatarUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ritmo-events/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
}).single("avatar");

// Event image uploader
export const eventImageUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ritmo-events/events",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 1200, height: 800, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
}).single("eventImage");

// Multiple event images uploader (for event galleries)
export const eventGalleryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ritmo-events/galleries",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 800, height: 600, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per file
    files: 5, // Max 5 files
  },
  fileFilter,
}).array("galleryImages", 5);

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (cloudinaryUrl) => {
  try {
    const urlParts = cloudinaryUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split(".")[0];
    const folder = urlParts.slice(-2, -1)[0];
    return `${folder}/${publicId}`;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

export { cloudinary };
