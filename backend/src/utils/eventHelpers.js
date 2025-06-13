// Event helper functions

export const getEventStatus = (event) => {
  const now = new Date();
  const eventDate = new Date(event.dateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : eventDate;

  if (event.status === "cancelled") return "cancelled";
  if (event.status === "rejected") return "rejected";
  if (event.status === "pending") return "pending";

  if (endDate < now) return "completed";
  if (eventDate <= now && endDate >= now) return "ongoing";
  if (eventDate > now) return "upcoming";

  return event.status;
};

export const canJoinEvent = (event, user) => {
  // Check if event is approved
  if (event.status !== "approved") return false;

  // Check if event is in the future
  if (new Date(event.dateTime) <= new Date()) return false;

  // Check if user is already participating
  const isParticipating = event.participants.some(
    (p) => p.user.toString() === user._id.toString()
  );
  if (isParticipating) return false;

  // Check if event is full
  if (
    event.maxParticipants &&
    event.currentParticipants >= event.maxParticipants
  ) {
    return false;
  }

  return true;
};

export const canEditEvent = (event, user) => {
  // Admin can edit everything
  if (user.role === "admin") return true;

  // Organizer can edit their own events
  if (event.organizer.toString() === user._id.toString()) {
    // But not if event is completed
    if (getEventStatus(event) === "completed") return false;
    return true;
  }

  return false;
};

export const buildEventQuery = (filters) => {
  const query = {};

  // Default to approved events for public access
  if (!filters.includeAll) {
    query.status = "approved";
  }

  // Search in title and description
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
      { tags: { $in: [new RegExp(filters.search, "i")] } },
    ];
  }

  // Location filters
  if (filters.city) {
    query["location.city"] = { $regex: filters.city, $options: "i" };
  }

  if (filters.region) {
    query["location.region"] = { $regex: filters.region, $options: "i" };
  }

  // Dance style filter
  if (filters.danceStyle) {
    query.danceStyle = filters.danceStyle;
  }

  // Skill level filter
  if (filters.skillLevel && filters.skillLevel !== "tutti") {
    query.$or = [{ skillLevel: "tutti" }, { skillLevel: filters.skillLevel }];
  }

  // Event type filter
  if (filters.eventType) {
    query.eventType = filters.eventType;
  }

  // Date range filters
  if (filters.dateFrom || filters.dateTo) {
    query.dateTime = {};
    if (filters.dateFrom) {
      query.dateTime.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.dateTime.$lte = new Date(filters.dateTo);
    }
  }

  // Price range filters
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    query.price = {};
    if (filters.priceMin !== undefined) {
      query.price.$gte = parseFloat(filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      query.price.$lte = parseFloat(filters.priceMax);
    }
  }

  // Featured filter
  if (filters.featured === true || filters.featured === "true") {
    query.featured = true;
  }

  // Organizer filter
  if (filters.organizer) {
    query.organizer = filters.organizer;
  }

  // Future events only (unless specified otherwise)
  if (filters.futureOnly !== false) {
    query.dateTime = { ...query.dateTime, $gte: new Date() };
  }

  return query;
};

export const getEventSortOptions = (sortBy = "date") => {
  const sortOptions = {
    date: { dateTime: 1 }, // Earliest first
    date_desc: { dateTime: -1 }, // Latest first
    title: { title: 1 },
    price: { price: 1 },
    price_desc: { price: -1 },
    featured: { featured: -1, dateTime: 1 }, // Featured first, then by date
    created: { createdAt: -1 }, // Newest first
    participants: { currentParticipants: -1 }, // Most popular first
  };

  return sortOptions[sortBy] || sortOptions.featured;
};
