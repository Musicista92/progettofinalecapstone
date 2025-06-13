export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Data non valida";

  switch (format) {
    case "short": {
      const shortOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      return date.toLocaleDateString("it-IT", shortOptions);
    }
    case "long": {
      const longOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      return date.toLocaleDateString("it-IT", longOptions);
    }
    case "time": {
      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleTimeString("it-IT", timeOptions);
    }
    case "datetime": {
      const datetimeOptions = {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString("it-IT", datetimeOptions);
    }
    case "full": {
      const fullOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString("it-IT", fullOptions);
    }
    default: {
      const defaultOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      return date.toLocaleDateString("it-IT", defaultOptions);
    }
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateTimeForInput = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getEventStatus = (startDate, endDate = null) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (now < start) {
    return "upcoming";
  } else if (end && now > end) {
    return "ended";
  } else if (!end && now.toDateString() !== start.toDateString()) {
    return "ended";
  } else {
    return "live";
  }
};

export const getDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return `${diffMinutes} min`;
  } else if (diffHours === 1) {
    return "1 ora";
  } else {
    return `${diffHours} ore`;
  }
};

export const isEventToday = (dateString) => {
  const today = new Date();
  const eventDate = new Date(dateString);

  return today.toDateString() === eventDate.toDateString();
};

export const isEventThisWeek = (dateString) => {
  const today = new Date();
  const eventDate = new Date(dateString);
  const weekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return eventDate >= today && eventDate <= weekFromToday;
};

export const getTimeUntilEvent = (dateString) => {
  const now = new Date();
  const eventDate = new Date(dateString);
  const diffMs = eventDate - now;

  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} giorni`;
  } else if (hours > 0) {
    return `${hours} ore`;
  } else {
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} minuti`;
  }
};
