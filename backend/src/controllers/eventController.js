import { validationResult } from "express-validator";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { createError } from "../middleware/errorHandlers.js";
import {
  createNotification,
  notificationHelpers,
} from "./notificationController.js";

//Tutti gli eventi con filtri e pagination
export const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Filters
    const {
      search,
      city,
      danceStyle,
      skillLevel,
      eventType,
      dateFrom,
      dateTo,
      status = "approved",
      featured,
      organizer,
      showPast,
    } = req.query;

    // Build query
    const query = {};

    // Status filter (admins can see all, others only approved)
    if (req.user?.role === "admin") {
      if (status) query.status = status;
    } else {
      query.status = "approved";
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Location filter
    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    // Dance style filter
    if (danceStyle) {
      query.danceStyle = danceStyle;
    }

    // Skill level filter
    if (skillLevel && skillLevel !== "tutti") {
      query.$or = [{ skillLevel: "tutti" }, { skillLevel: skillLevel }];
    }

    // Event type filter
    if (eventType) {
      query.eventType = eventType;
    }

    // Featured filter
    if (featured === "true") {
      query.featured = true;
    }

    // Organizer filter
    if (organizer) {
      query.organizer = organizer;
    }

    // Date range filter - Handle this carefully
    const dateFilter = {};

    // If specific date range is provided
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
    } else {
      // Only show future events by default (unless admin or showPast=true)
      if (req.user?.role !== "admin" && showPast !== "true") {
        dateFilter.$gte = new Date();
      }
    }

    // Apply date filter if any conditions were set
    if (Object.keys(dateFilter).length > 0) {
      query.dateTime = dateFilter;
    }

    const events = await Event.find(query)
      .populate("organizer", "name avatar bio")
      .populate("participants.user", "name avatar")
      .limit(limit)
      .skip(skip)
      .sort({ featured: -1, dateTime: 1 }); // Featured first, then by date

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getEvents:", error);
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name avatar bio contactInfo followers following")
      .populate("participants.user", "name avatar bio");

    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    if (
      event.status !== "approved" &&
      req.user?.role !== "admin" &&
      event.organizer._id.toString() !== req.user?._id.toString()
    ) {
      throw createError(404, "Evento non disponibile");
    }

    // Trasforma l'evento e l'organizzatore in oggetti manipolabili
    const eventObject = event.toObject();

    // Controlla lo stato di "favourite" e "following" SOLO se l'utente è loggato
    if (req.user) {
      // Controlla se l'utente corrente ha messo l'evento tra i preferiti
      eventObject.isFavourite = req.user.favouriteEvents.some((favId) =>
        favId.equals(event._id)
      );

      // Controlla se l'utente corrente segue l'organizzatore
      if (eventObject.organizer) {
        // Recupera l'utente corrente con i suoi following
        const currentUser = await User.findById(req.user._id).select(
          "following"
        );
        eventObject.organizer.isFollowing = currentUser.following.some(
          (followedId) => followedId.equals(eventObject.organizer._id)
        );
      }
    } else {
      eventObject.isFavourite = false;
      if (eventObject.organizer) {
        eventObject.organizer.isFollowing = false;
      }
    }

    res.json({
      success: true,
      data: {
        event: eventObject,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer/Admin)
export const createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
    };

    // La validazione ora avviene dopo l'upload, quindi i dati sono già pronti
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati evento non validi");
      error.errorsList = errors.array();
      throw error;
    }

    // Aggiungi l'URL dell'immagine da Cloudinary (se esiste)
    if (req.file) {
      eventData.image = req.file.path; // req.file.path contiene l'URL sicuro di Cloudinary
    }

    // Imposta l'organizzatore e lo stato
    eventData.organizer = req.user._id;
    if (req.user.role === "admin") {
      eventData.status = "approved";
    }

    const event = new Event(eventData);
    await event.save();

    if (event.status === "pending") {
      // Notifica 1: Per l'organizzatore che ha creato l'evento
      await createNotification({
        recipient: req.user._id, // L'organizzatore stesso
        type: "event_pending",
        title: "Evento in attesa di revisione",
        message: `Il tuo evento "${event.title}" è stato ricevuto e verrà revisionato dal nostro team.`,
        data: {
          eventId: event._id,
        },
        actionUrl: `/my-events/${event._id}`, // O una pagina di gestione eventi
      });

      // Notifica 2: Per tutti gli amministratori
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminNotifications = admins.map((admin) =>
        createNotification({
          recipient: admin._id,
          type: "admin_event_pending",
          title: "Nuovo evento da approvare",
          message: `L'organizzatore "${req.user.name}" ha sottomesso un nuovo evento per l'approvazione: "${event.title}".`,
          data: {
            eventId: event._id,
            fromUser: req.user._id,
          },
          actionUrl: `/admin`, // Link alla dashboard admin
        })
      );

      // Eseguiamo tutte le promesse di creazione notifica in parallelo
      await Promise.all(adminNotifications);
    }

    await event.populate("organizer", "name avatar bio");

    res.status(201).json({
      success: true,
      message:
        req.user.role === "admin"
          ? "Evento creato e pubblicato"
          : "Evento creato, in attesa di approvazione",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin)
export const updateEvent = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati evento non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check permissions
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato a modificare questo evento");
    }

    // Prevent certain updates based on event status
    if (event.status === "completed" && req.user.role !== "admin") {
      throw createError(400, "Non è possibile modificare un evento completato");
    }

    // If organizer updates approved event, set to pending (unless admin)
    if (event.status === "approved" && req.user.role !== "admin") {
      req.body.status = "pending";
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("organizer", "name avatar bio");

    res.json({
      success: true,
      message: "Evento aggiornato con successo",
      data: { event: updatedEvent },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check permissions
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw createError(403, "Non autorizzato a eliminare questo evento");
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Evento eliminato con successo",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join/Leave event
// @route   POST /api/events/:id/participate
// @access  Private
export const toggleParticipation = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Check if event is approved and in the future
    if (event.status !== "approved") {
      throw createError(400, "L'evento non è ancora approvato");
    }

    if (new Date(event.dateTime) <= new Date()) {
      throw createError(400, "Non è possibile partecipare a eventi passati");
    }

    const userId = req.user._id;
    const existingParticipation = event.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (existingParticipation) {
      // Leave event
      event.participants = event.participants.filter(
        (p) => p.user.toString() !== userId.toString()
      );
      event.currentParticipants = Math.max(0, event.currentParticipants - 1);

      await event.save();

      res.json({
        success: true,
        message: "Hai lasciato l'evento",
        data: { isParticipating: false },
      });
    } else {
      // Join event
      if (
        event.maxParticipants &&
        event.currentParticipants >= event.maxParticipants
      ) {
        throw createError(400, "Evento al completo");
      }

      event.participants.push({
        user: userId,
        registeredAt: new Date(),
        status: "registered",
      });
      event.currentParticipants += 1;

      await event.save();

      res.json({
        success: true,
        message: "Ti sei iscritto all'evento",
        data: { isParticipating: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add/Remove event from favourites
// @route   POST /api/events/:id/favourite
// @access  Private
export const toggleFavourite = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Verifica che l'evento esista
    const event = await Event.findById(eventId).populate("organizer", "name");
    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    // Verifica che l'evento sia approvato
    if (event.status !== "approved") {
      throw createError(
        400,
        "Non è possibile aggiungere ai preferiti un evento non approvato"
      );
    }

    // Non permettere di aggiungere ai preferiti il proprio evento
    if (event.organizer._id.toString() === userId.toString()) {
      throw createError(
        400,
        "Non puoi aggiungere ai preferiti il tuo stesso evento"
      );
    }

    const user = await User.findById(userId);
    const isFavourite = user.favouriteEvents.includes(eventId);

    if (isFavourite) {
      // Rimuovi dai preferiti
      user.favouriteEvents = user.favouriteEvents.filter(
        (id) => id.toString() !== eventId.toString()
      );
      await user.save();

      res.json({
        success: true,
        message: "Evento rimosso dai preferiti",
        data: { isFavourite: false },
      });
    } else {
      // Aggiungi ai preferiti
      user.favouriteEvents.push(eventId);
      await user.save();

      // Invia notifica all'organizzatore
      try {
        await createNotification({
          recipient: event.organizer._id,
          type: "event_favourite",
          title: "Evento aggiunto ai preferiti",
          message: `${req.user.name} ha aggiunto il tuo evento "${event.title}" ai suoi preferiti`,
          data: {
            eventId: event._id,
            fromUser: userId,
          },
          actionUrl: `/events/${event._id}`,
        });
      } catch (notificationError) {
        console.error(
          "Error creating favourite notification:",
          notificationError
        );
        // Non fallire l'operazione se la notifica non viene creata
      }

      res.json({
        success: true,
        message: "Evento aggiunto ai preferiti",
        data: { isFavourite: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favourite events
// @route   GET /api/events/favourites
// @access  Private
export const getFavouriteEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .select("favouriteEvents")
      .populate({
        path: "favouriteEvents",
        match: { status: "approved" }, // Solo eventi approvati
        options: {
          limit: parseInt(limit),
          skip: skip,
          sort: { createdAt: -1 },
        },
        populate: [
          { path: "organizer", select: "name avatar bio" },
          { path: "participants.user", select: "name avatar" },
        ],
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
        events: user.favouriteEvents || [],
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

// @desc    Update event status (Admin only)
// @route   PUT /api/events/:id/status
// @access  Private (Admin)
export const updateEventStatus = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = createError(400, "Dati status non validi");
      error.errorsList = errors.array();
      throw error;
    }

    const { status, rejectionReason } = req.body;

    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );

    if (!event) {
      throw createError(404, "Evento non trovato");
    }

    const previousStatus = event.status;
    event.status = status;

    if (status === "rejected" && rejectionReason) {
      event.rejectionReason = rejectionReason;
    }

    await event.save();

    // Invia notifica all'organizzatore solo se lo status è cambiato
    if (previousStatus !== status) {
      try {
        let notificationData;

        switch (status) {
          case "approved":
            notificationData = notificationHelpers.eventApproved(
              event._id,
              event.organizer._id,
              event.title
            );
            break;
          case "rejected":
            notificationData = notificationHelpers.eventRejected(
              event._id,
              event.organizer._id,
              event.title,
              rejectionReason
            );
            break;
          case "cancelled":
            notificationData = notificationHelpers.eventCancelled(
              event._id,
              event.organizer._id,
              event.title
            );
            break;
        }

        if (notificationData) {
          await createNotification(notificationData);
        }
      } catch (notificationError) {
        console.error("Errore creazione notifica:", notificationError);
        // Non far fallire l'operazione se la notifica non viene creata
      }
    }

    res.json({
      success: true,
      message: `Evento ${
        status === "approved"
          ? "approvato"
          : status === "rejected"
          ? "rifiutato"
          : status === "cancelled"
          ? "annullato"
          : "aggiornato"
      }`,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's events (as organizer)
// @route   GET /api/events/my-events
// @access  Private (Organizer/Admin)
export const getMyEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status; // all, pending, approved, rejected, cancelled

    const query = { organizer: req.user._id };
    if (status && status !== "all") {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate("participants.user", "name avatar")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
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

// @desc    Get user's joined events
// @route   GET /api/events/joined
// @access  Private
export const getJoinedEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const upcoming = req.query.upcoming === "true";

    const query = {
      "participants.user": req.user._id,
      status: "approved",
    };

    if (upcoming) {
      query.dateTime = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate("organizer", "name avatar")
      .limit(limit)
      .skip(skip)
      .sort({ dateTime: upcoming ? 1 : -1 });

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
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