import User from "../models/User.js";
import Event from "../models/Event.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import { createError } from "../middleware/errorHandlers.js";
import { emailService } from "../services/emailService.js";
import {
  createNotification,
  notificationHelpers,
} from "./notificationController.js";

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Event statistics
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const approvedEvents = await Event.countDocuments({ status: "approved" });
    const eventsThisMonth = await Event.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Participation statistics
    const totalParticipations = await Event.aggregate([
      { $group: { _id: null, total: { $sum: "$currentParticipants" } } },
    ]);

    // Comment statistics
    const totalComments = await Comment.countDocuments();
    const commentsThisMonth = await Comment.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Average event rating
    const avgRating = await Comment.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    // Top cities by events
    const topCities = await Event.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$location.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Event types distribution
    const eventTypes = await Event.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]);

    // Dance styles distribution
    const danceStyles = await Event.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$danceStyle", count: { $sum: 1 } } },
    ]);
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          thisMonth: usersThisMonth,
          byRole: usersByRole,
        },
        events: {
          total: totalEvents,
          pending: pendingEvents,
          approved: approvedEvents,
          thisMonth: eventsThisMonth,
          topCities,
          eventTypes,
          danceStyles,
        },
        engagement: {
          totalParticipations: totalParticipations[0]?.total || 0,
          totalComments,
          commentsThisMonth,
          avgRating: avgRating[0]?.avgRating
            ? parseFloat(avgRating[0].avgRating.toFixed(1))
            : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, role, isVerified } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;

    const updatedUser = await user.save();
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    // Gestisce errori di duplicazione email
    if (error.code === 11000) {
      return next(createError(400, "L'email è già in uso."));
    }
    next(error);
  }
};

// @desc    Get events by month (for charts)
// @route   GET /api/admin/events-by-month
// @access  Private (Admin)
export const getEventsByMonth = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const eventsByMonth = await Event.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          total: { $sum: "$count" },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "approved"] }, "$count", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "pending"] }, "$count", 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "rejected"] }, "$count", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing months with zeros
    const monthNames = [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ];

    const result = monthNames.map((name, index) => {
      const monthData = eventsByMonth.find((item) => item._id === index + 1);
      return {
        month: name,
        total: monthData?.total || 0,
        approved: monthData?.approved || 0,
        pending: monthData?.pending || 0,
        rejected: monthData?.rejected || 0,
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user growth analytics
// @route   GET /api/admin/user-growth
// @access  Private (Admin)
export const getUserGrowth = async (req, res, next) => {
  try {
    const { period = "6months" } = req.query;

    let dateFilter;
    switch (period) {
      case "1month":
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months
    }

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      success: true,
      data: userGrowth,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending events for approval
// @route   GET /api/admin/pending-events
// @access  Private (Admin)
export const getPendingEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const pendingEvents = await Event.find({ status: "pending" })
      .populate("organizer", "name email avatar")
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments({ status: "pending" });

    res.json({
      success: true,
      data: {
        events: pendingEvents,
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

// @desc    Bulk approve events
// @route   POST /api/admin/events/bulk-approve
// @access  Private (Admin)
export const bulkApproveEvents = async (req, res, next) => {
  try {
    const { eventIds } = req.body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      throw createError(400, "Lista eventi non valida");
    }

    const events = await Event.find({
      _id: { $in: eventIds },
      status: "pending",
    }).populate("organizer", "name email");

    if (events.length === 0) {
      throw createError(404, "Nessun evento in attesa trovato");
    }

    // Update events status
    await Event.updateMany(
      { _id: { $in: eventIds }, status: "pending" },
      { status: "approved" }
    );

    // Send notifications and emails
    for (const event of events) {
      try {
        // Create notification
        const notificationData = notificationHelpers.eventApproved(
          event._id,
          event.organizer._id
        );
        await createNotification(notificationData);

        // Send email if organizer has notifications enabled
        if (event.organizer.preferences?.notifications?.email !== false) {
          await emailService.sendEventApprovedEmail(event, event.organizer);
        }
      } catch (notificationError) {
        console.error(
          "Error sending approval notification:",
          notificationError
        );
        // Don't fail the approval if notification fails
      }
    }

    res.json({
      success: true,
      message: `${events.length} eventi approvati con successo`,
      data: { approvedCount: events.length },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system health metrics
// @route   GET /api/admin/system-health
// @access  Private (Admin)
export const getSystemHealth = async (req, res, next) => {
  try {
    // Database connection health
    const dbConnected = true; // If we reach here, DB is connected

    // Count recent activities
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const recentEvents = await Event.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const recentComments = await Comment.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // System metrics
    const systemHealth = {
      database: {
        connected: dbConnected,
        status: "healthy",
      },
      api: {
        status: "operational",
        uptime: process.uptime(),
      },
      activity: {
        usersLast24h: recentUsers,
        eventsLast24h: recentEvents,
        commentsLast24h: recentComments,
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
      },
    };

    res.json({
      success: true,
      data: systemHealth,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular content
// @route   GET /api/admin/popular-content
// @access  Private (Admin)
export const getPopularContent = async (req, res, next) => {
  try {
    // Most popular events (by participants)
    const popularEvents = await Event.find({ status: "approved" })
      .populate("organizer", "name avatar")
      .sort({ currentParticipants: -1 })
      .limit(10)
      .select(
        "title dateTime location currentParticipants maxParticipants organizer"
      );

    // Most active organizers
    const activeOrganizers = await Event.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$organizer",
          eventCount: { $sum: 1 },
          totalParticipants: { $sum: "$currentParticipants" },
        },
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "organizer",
        },
      },
      { $unwind: "$organizer" },
      {
        $project: {
          "organizer.name": 1,
          "organizer.avatar": 1,
          "organizer.email": 1,
          eventCount: 1,
          totalParticipants: 1,
        },
      },
    ]);

    // Most commented events
    const mostCommentedEvents = await Comment.aggregate([
      {
        $group: {
          _id: "$event",
          commentCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { commentCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $project: {
          "event.title": 1,
          "event.dateTime": 1,
          "event.location.venue": 1,
          commentCount: 1,
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        popularEvents,
        activeOrganizers,
        mostCommentedEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send broadcast notification
// @route   POST /api/admin/broadcast
// @access  Private (Admin)
export const sendBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, userIds, sendEmail = false } = req.body;

    if (!title || !message) {
      throw createError(400, "Titolo e messaggio sono richiesti");
    }

    let recipients;
    if (userIds && userIds.length > 0) {
      // Send to specific users
      recipients = await User.find({ _id: { $in: userIds } });
    } else {
      // Send to all users
      recipients = await User.find({});
    }

    if (recipients.length === 0) {
      throw createError(404, "Nessun destinatario trovato");
    }

    // Create notifications
    const notifications = recipients.map((user) => ({
      recipient: user._id,
      type: "system",
      title,
      message,
      data: {},
    }));

    await Notification.insertMany(notifications);

    // Send emails if requested
    if (sendEmail) {
      const emailPromises = recipients.map((user) =>
        emailService.sendCustomEmail(
          user.email,
          title,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #667eea; color: white; padding: 30px; text-align: center;">
                <h1>📢 ${title}</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2>Ciao ${user.name}!</h2>
                <p>${message}</p>
              </div>
            </div>
          `
        )
      );

      try {
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error("Error sending broadcast emails:", emailError);
        // Don't fail if emails fail
      }
    }

    res.json({
      success: true,
      message: `Notifica inviata a ${recipients.length} utenti`,
      data: { recipientCount: recipients.length },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw createError(404, "Utente non trovato");
    }

    // Non permettere all'admin di cancellare se stesso
    if (user._id.toString() === req.user._id.toString()) {
      throw createError(
        400,
        "Non puoi cancellare il tuo stesso account da admin."
      );
    }

    await user.deleteOne();

    // Qui potresti aggiungere logica per pulire i dati collegati (eventi, commenti etc.)
    // Per ora, ci limitiamo a cancellare l'utente.

    res.json({ success: true, message: "Utente cancellato con successo." });
  } catch (error) {
    next(error);
  }
};
