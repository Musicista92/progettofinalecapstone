import User from "../models/User.js";
import Event from "../models/Event.js";
import { createError } from "../middleware/errorHandlers.js";
import {
  createNotification,
  notificationHelpers,
} from "./notificationController.js";

// @desc    Get all users (with pagination and search)
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const role = req.query.role;
    const city = req.query.city;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    const users = await User.find(query)
      .select(
        "name email avatar bio role location preferences followers following createdAt"
      )
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        "name email avatar bio role location preferences followers following favouriteEvents createdAt"
      )
      .populate("following", "name avatar bio location")
      .populate("followers", "name avatar bio location")
      .populate({
        path: "favouriteEvents",
        match: { status: "approved" },
        select: "title image dateTime location.venue danceStyle",
        options: { limit: 6, sort: { createdAt: -1 } },
      });

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    const organizedEvents = await Event.find({
      organizer: user._id,
      status: "approved",
    })
      .sort({ dateTime: -1 })
      .limit(10)
      .select("title image dateTime location description price");

    // Crea l'oggetto di risposta base
    const userData = {
      ...user.toObject(),
      organizedEvents,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      favouritesCount: user.favouriteEvents?.length || 0,
    };

    // Se c'è un utente autenticato, verifica se segue questo profilo
    if (req.user) {
      // Recupera l'utente corrente con i suoi following
      const currentUser = await User.findById(req.user._id).select("following");
      userData.isFollowing = currentUser.following.some((followedId) =>
        followedId.equals(user._id)
      );
    } else {
      userData.isFollowing = false;
    }

    res.json({
      success: true,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user; // Usa direttamente l'utente dal middleware auth

    if (targetUserId === currentUser._id.toString()) {
      throw createError(400, "Non puoi seguire te stesso");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw createError(404, "Utente non trovato");
    }

    // Usa il metodo .some() con .equals() per un confronto più sicuro tra ObjectId
    const isFollowing = currentUser.following.some((id) =>
      id.equals(targetUserId)
    );

    if (isFollowing) {
      // Unfollow
      // Usiamo $pull per rimuovere atomicamente gli ID dagli array
      await currentUser.updateOne({ $pull: { following: targetUserId } });
      await targetUser.updateOne({ $pull: { followers: currentUser._id } });
    } else {
      // Follow
      // Usiamo $addToSet per aggiungere atomicamente e prevenire duplicati
      await currentUser.updateOne({ $addToSet: { following: targetUserId } });
      await targetUser.updateOne({ $addToSet: { followers: currentUser._id } });

      try {
        const notificationData = notificationHelpers.newFollower(
          currentUser._id,
          targetUserId
        );
        await createNotification(notificationData);
      } catch (notificationError) {
        console.error("Error creating follow notification:", notificationError);
      }
    }

    // Ricava i conteggi aggiornati dopo le operazioni
    const updatedTargetUser = await User.findById(targetUserId).select(
      "followers"
    );
    const updatedCurrentUser = await User.findById(currentUser._id).select(
      "following"
    );

    res.json({
      success: true,
      message: isFollowing
        ? "Non segui più questo utente"
        : "Ora segui questo utente",
      data: {
        isFollowing: !isFollowing,
        followersCount: updatedTargetUser.followers.length,
        followingCount: updatedCurrentUser.following.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getUserFollowers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id).populate({
      path: "followers",
      select: "name avatar bio location createdAt",
      options: {
        limit: parseInt(limit),
        skip: skip,
        sort: { createdAt: -1 },
      },
    });

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    const totalFollowers = await User.findById(req.params.id).select(
      "followers"
    );

    res.json({
      success: true,
      data: {
        followers: user.followers,
        count: totalFollowers.followers.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFollowers.followers.length,
          pages: Math.ceil(totalFollowers.followers.length / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
export const getUserFollowing = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id).populate({
      path: "following",
      select: "name avatar bio location createdAt",
      options: {
        limit: parseInt(limit),
        skip: skip,
        sort: { createdAt: -1 },
      },
    });

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    const totalFollowing = await User.findById(req.params.id).select(
      "following"
    );

    res.json({
      success: true,
      data: {
        following: user.following,
        count: totalFollowing.following.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFollowing.following.length,
          pages: Math.ceil(totalFollowing.following.length / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favourite events (public route)
// @route   GET /api/users/:id/favourites
// @access  Public
export const getUserFavourites = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id).populate({
      path: "favouriteEvents",
      match: { status: "approved" },
      options: {
        limit: parseInt(limit),
        skip: skip,
        sort: { createdAt: -1 },
      },
      populate: [{ path: "organizer", select: "name avatar bio" }],
    });

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    // Count total favourites (solo approvati)
    const totalFavourites = await User.aggregate([
      { $match: { _id: user._id } },
      { $unwind: "$favouriteEvents" },
      {
        $lookup: {
          from: "events",
          localField: "favouriteEvents",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      { $match: { "event.status": "approved" } },
      { $count: "total" },
    ]);

    const total = totalFavourites.length > 0 ? totalFavourites[0].total : 0;

    res.json({
      success: true,
      data: {
        favourites: user.favouriteEvents || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users suggestions (people to follow)
// @route   GET /api/users/suggestions
// @access  Private
export const getUserSuggestions = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { limit = 10 } = req.query;

    // Find users that the current user is not following
    // and exclude the current user
    const suggestions = await User.find({
      _id: {
        $nin: [...currentUser.following, currentUser._id],
      },
    })
      .select("name avatar bio location role")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      throw createError(
        400,
        "Query di ricerca troppo corta (minimo 2 caratteri)"
      );
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
      ],
    })
      .select("name avatar bio role location")
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};