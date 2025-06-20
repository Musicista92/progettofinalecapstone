import { validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { createError } from "../middleware/errorHandlers.js";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    // Check validation errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const error = createError(400, "Dati di registrazione non validi");
    //   error.errorsList = errors.array();
    //   throw error;
    // }

    const { name, email, password, role = "user" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError(400, "Email già registrata");
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registrazione completata con successo",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati di login non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw createError(401, "Credenziali non valide");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createError(401, "Credenziali non valide");
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: "Login effettuato con successo",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("following", "name avatar")
      .populate("followers", "name avatar");

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    // Gestisci il caso in cui req.body sia undefined o vuoto
    const { name = "", city = "" } = req.body || {};

    const user = await User.findById(req.user.id);

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    // Aggiorna i campi di testo solo se forniti
    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (city !== undefined) {
      // Assicura che 'location' esista prima di assegnare 'city'
      user.location = { ...(user.location || {}), city: city.trim() };
    }

    // Aggiorna l'avatar se un nuovo file è stato caricato
    if (req.file) {
      // Cancella il vecchio avatar da Cloudinary se non è quello di default
      if (user.avatar && user.avatar.includes("cloudinary")) {
        const oldPublicId = extractPublicId(user.avatar);
        if (oldPublicId) {
          // Non bloccare l'operazione se la cancellazione fallisce
          try {
            await deleteFromCloudinary(oldPublicId);
          } catch (e) {
            console.error("Failed to delete old avatar:", e);
          }
        }
      }
      user.avatar = req.file.path; // req.file.path è l'URL sicuro di Cloudinary
    }

    const updatedUser = await user.save();

    // Rimuovi la password dalla risposta per sicurezza
    updatedUser.password = undefined;

    res.json({
      success: true,
      message: "Profilo aggiornato con successo!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Errore updateProfile:", error);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati password non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw createError(400, "Password attuale non corretta");
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({
      success: true,
      message: "Password aggiornata con successo",
    });
  } catch (error) {
    next(error);
  }
};