// src/controllers/uploadController.js
import User from "../models/User.js";
import Event from "../models/Event.js";
import { createError } from "../middleware/errorHandlers.js";
import { deleteFromCloudinary, extractPublicId } from "../config/upload.js";

// @desc    Upload user avatar
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "Nessun file caricato");
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar if exists and it's not the default one
    if (user.avatar && user.avatar.includes("cloudinary")) {
      const oldPublicId = extractPublicId(user.avatar);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          console.error("Error deleting old avatar:", deleteError);
          // Don't fail upload if old image deletion fails
        }
      }
    }

    // Update user avatar
    user.avatar = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: "Avatar caricato con successo",
      data: {
        avatar: req.file.path,
        publicId: req.file.filename,
      },
    });
  } catch (error) {
    // If upload succeeded but processing failed, clean up uploaded file
    if (req.file && req.file.filename) {
      try {
        await deleteFromCloudinary(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up failed upload:", cleanupError);
      }
    }
    next(error);
  }
};

// @desc    Upload event image
// @route   POST /api/upload/event-image/:eventId
// @access  Private (Event organizer or admin)
export const uploadEventImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "Nessun file caricato");
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check permissions
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato");
    }

    // Delete old image if exists and it's not the default one
    if (event.image && event.image.includes("cloudinary")) {
      const oldPublicId = extractPublicId(event.image);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          console.error("Error deleting old event image:", deleteError);
        }
      }
    }

    // Update event image
    event.image = req.file.path;
    await event.save();

    res.json({
      success: true,
      message: "Immagine evento caricata con successo",
      data: {
        image: req.file.path,
        publicId: req.file.filename,
      },
    });
  } catch (error) {
    if (req.file && req.file.filename) {
      try {
        await deleteFromCloudinary(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up failed upload:", cleanupError);
      }
    }
    next(error);
  }
};

// @desc    Upload event gallery images
// @route   POST /api/upload/event-gallery/:eventId
// @access  Private (Event organizer or admin)
export const uploadEventGallery = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw createError(400, "Nessun file caricato");
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check permissions
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato");
    }

    // Add gallery images to event
    const galleryImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      uploadedAt: new Date(),
    }));

    // Initialize gallery if it doesn't exist
    if (!event.gallery) {
      event.gallery = [];
    }

    event.gallery.push(...galleryImages);
    await event.save();

    res.json({
      success: true,
      message: `${req.files.length} immagini caricate con successo`,
      data: {
        images: galleryImages,
        totalGalleryImages: event.gallery.length,
      },
    });
  } catch (error) {
    // Clean up uploaded files if processing failed
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await deleteFromCloudinary(file.filename);
        } catch (cleanupError) {
          console.error("Error cleaning up failed upload:", cleanupError);
        }
      }
    }
    next(error);
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/upload/event-gallery/:eventId/:imageId
// @access  Private (Event organizer or admin)
export const deleteGalleryImage = async (req, res, next) => {
  try {
    const { eventId, imageId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check permissions
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato");
    }

    // Find image in gallery
    const imageIndex = event.gallery.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      throw createError(404, "Immagine non trovata");
    }

    const imageToDelete = event.gallery[imageIndex];

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(imageToDelete.publicId);
    } catch (deleteError) {
      console.error("Error deleting from Cloudinary:", deleteError);
      // Continue with removal from database even if Cloudinary deletion fails
    }

    // Remove from event gallery
    event.gallery.splice(imageIndex, 1);
    await event.save();

    res.json({
      success: true,
      message: "Immagine eliminata con successo",
      data: {
        remainingImages: event.gallery.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upload stats (admin only)
// @route   GET /api/upload/stats
// @access  Private (Admin)
export const getUploadStats = async (req, res, next) => {
  try {
    // Count total images uploaded
    const totalAvatars = await User.countDocuments({
      avatar: { $regex: "cloudinary" },
    });

    const totalEventImages = await Event.countDocuments({
      image: { $regex: "cloudinary" },
    });

    const eventsWithGallery = await Event.find({
      gallery: { $exists: true, $not: { $size: 0 } },
    });

    const totalGalleryImages = eventsWithGallery.reduce(
      (total, event) => total + (event.gallery?.length || 0),
      0
    );

    res.json({
      success: true,
      data: {
        totalAvatars,
        totalEventImages,
        totalGalleryImages,
        totalImages: totalAvatars + totalEventImages + totalGalleryImages,
        eventsWithGallery: eventsWithGallery.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
