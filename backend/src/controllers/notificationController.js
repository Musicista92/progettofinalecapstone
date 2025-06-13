import Notification from "../models/Notification.js";
import { createError } from "../middleware/errorHandlers.js";

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    if (unreadOnly === "true") {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate("data.fromUser", "name avatar")
      .populate("data.eventId", "title dateTime location.venue")
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw createError(404, "Notifica non trovata");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw createError(403, "Non autorizzato");
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: "Notifica segnata come letta",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: "Tutte le notifiche sono state segnate come lette",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw createError(404, "Notifica non trovata");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw createError(403, "Non autorizzato");
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Notifica eliminata",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification (internal use)
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Helper functions for different notification types
export const notificationHelpers = {
  // Event notifications
  eventApproved: (eventId, organizerId) => ({
    recipient: organizerId,
    type: "event_approved",
    title: "Evento Approvato",
    message: "Il tuo evento è stato approvato ed è ora visibile pubblicamente",
    data: { eventId },
    actionUrl: `/events/${eventId}`,
  }),

  eventRejected: (eventId, organizerId, reason) => ({
    recipient: organizerId,
    type: "event_rejected",
    title: "Evento Rifiutato",
    message: `Il tuo evento è stato rifiutato. ${
      reason ? "Motivo: " + reason : ""
    }`,
    data: { eventId },
    actionUrl: `/events/${eventId}`,
  }),

  eventReminder: (eventId, userId, eventTitle) => ({
    recipient: userId,
    type: "event_reminder",
    title: "Promemoria Evento",
    message: `L'evento "${eventTitle}" inizia tra 1 ora`,
    data: { eventId },
    actionUrl: `/events/${eventId}`,
  }),

  // NUOVO: Notifica per evento aggiunto ai preferiti
  eventFavourite: (eventId, organizerId, userName, eventTitle) => ({
    recipient: organizerId,
    type: "event_favourite",
    title: "Evento aggiunto ai preferiti",
    message: `${userName} ha aggiunto il tuo evento "${eventTitle}" ai suoi preferiti`,
    data: { eventId },
    actionUrl: `/events/${eventId}`,
  }),

  newComment: (eventId, commentAuthorId, eventOwnerId, eventTitle) => ({
    recipient: eventOwnerId,
    type: "new_comment",
    title: "Nuovo Commento",
    message: `Qualcuno ha commentato il tuo evento "${eventTitle}"`,
    data: { eventId, fromUser: commentAuthorId },
    actionUrl: `/events/${eventId}`,
  }),

  commentReply: (commentId, eventId, replyAuthorId, commentAuthorId) => ({
    recipient: commentAuthorId,
    type: "comment_reply",
    title: "Risposta al Commento",
    message: "Qualcuno ha risposto al tuo commento",
    data: { eventId, commentId, fromUser: replyAuthorId },
    actionUrl: `/events/${eventId}`,
  }),

  // Social notifications
  newFollower: (followerId, followedId) => ({
    recipient: followedId,
    type: "follow",
    title: "Nuovo Follower",
    message: "Ha iniziato a seguirti",
    data: { fromUser: followerId },
    actionUrl: `/users/${followerId}`,
  }),

  eventLike: (eventId, likerId, eventOwnerId, eventTitle) => ({
    recipient: eventOwnerId,
    type: "like",
    title: "Mi Piace",
    message: `A qualcuno piace il tuo evento "${eventTitle}"`,
    data: { eventId, fromUser: likerId },
    actionUrl: `/events/${eventId}`,
  }),
};
