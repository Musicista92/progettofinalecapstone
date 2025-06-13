import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "new_event",
        "event_approved",
        "event_rejected",
        "event_reminder",
        "event_pending",
        "admin_event_pending",
        "event_cancelled",
        "new_comment",
        "comment_reply",
        "follow",
        "like",
        "event_updated",
        "event_favourite",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 200,
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    data: {
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
      commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
      fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String, // URL to navigate to when notification is clicked
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1 });

export default mongoose.model("Notification", notificationSchema);
