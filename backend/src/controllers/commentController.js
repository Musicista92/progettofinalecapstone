import { validationResult } from "express-validator";
import Comment from "../models/Comment.js";
import Event from "../models/Event.js";
import { createError } from "../middleware/errorHandlers.js";

// @desc    Get comments for an event
// @route   GET /api/events/:eventId/comments
// @access  Public
export const getEventComments = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      event: eventId,
      parentComment: null,
    })
      .populate("author", "name avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name avatar",
        },
      })
      .limit(limit * 1)
      .skip(skip)
      .sort({ [sortBy]: -1 });

    const total = await Comment.countDocuments({
      event: eventId,
      parentComment: null,
    });

    res.json({
      success: true,
      data: {
        comments,
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

// @desc    Add comment to event
// @route   POST /api/events/:eventId/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati commento non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const { eventId } = req.params;
    const { content, rating, parentComment } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Create comment
    const comment = new Comment({
      content,
      rating: rating || null,
      author: req.user._id,
      event: eventId,
      parentComment: parentComment || null,
    });

    await comment.save();

    // If it's a reply, add to parent's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id },
      });
    }

    // Populate author info
    await comment.populate("author", "name avatar");

    res.status(201).json({
      success: true,
      message: "Commento aggiunto con successo",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (Author only)
export const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati commento non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw createError(404, "Commento non trovato");
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      throw createError(403, "Non autorizzato a modificare questo commento");
    }

    const { content, rating } = req.body;

    comment.content = content;
    if (rating !== undefined) comment.rating = rating;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate("author", "name avatar");

    res.json({
      success: true,
      message: "Commento aggiornato con successo",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Author or Admin)
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw createError(404, "Commento non trovato");
    }

    // Check permissions
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato a eliminare questo commento");
    }

    // If comment has replies, don't delete but mark as deleted
    if (comment.replies.length > 0) {
      comment.content = "[Commento eliminato]";
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save();
    } else {
      // Remove from parent replies if it's a reply
      if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
          $pull: { replies: comment._id },
        });
      }
      await Comment.findByIdAndDelete(req.params.id);
    }

    res.json({
      success: true,
      message: "Commento eliminato con successo",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw createError(404, "Commento non trovato");
    }

    const userId = req.user._id;
    const existingLike = comment.likes.find(
      (like) => like.user.toString() === userId.toString()
    );

    if (existingLike) {
      // Remove like
      comment.likes = comment.likes.filter(
        (like) => like.user.toString() !== userId.toString()
      );
    } else {
      // Add like
      comment.likes.push({ user: userId });
    }

    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({
      success: true,
      message: existingLike ? "Like rimosso" : "Like aggiunto",
      data: {
        isLiked: !existingLike,
        likesCount: comment.likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
