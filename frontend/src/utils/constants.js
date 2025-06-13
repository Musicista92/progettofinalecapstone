// Event types
export const EVENT_TYPES = {
  SERATA: "serata",
  WORKSHOP: "workshop",
  CONGRESSO: "congresso",
};

// Dance genres
export const DANCE_GENRES = {
  SALSA: "salsa",
  BACHATA: "bachata",
  MISTO: "misto",
};

// User roles
export const USER_ROLES = {
  USER: "user",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

// Event status
export const EVENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

// Cities in Campania
export const CAMPANIA_CITIES = [
  "Napoli",
  "Salerno",
  "Caserta",
  "Avellino",
  "Benevento",
  "Torre del Greco",
  "Giugliano in Campania",
  "Pozzuoli",
  "Castellammare di Stabia",
  "Afragola",
];

// Date formats
export const DATE_FORMATS = {
  SHORT: "dd/MM/yyyy",
  LONG: "dd MMMM yyyy",
  WITH_TIME: "dd/MM/yyyy HH:mm",
  TIME_ONLY: "HH:mm",
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  EVENT_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  EVENT_DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000,
  },
};

// Default images
export const DEFAULT_IMAGES = {
  EVENT:
    "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop",
  AVATAR:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
  PLACEHOLDER: "https://via.placeholder.com/800x600/ff6b6b/ffffff?text=Evento",
};

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: "Login effettuato con successo!",
    LOGOUT: "Logout effettuato con successo!",
    REGISTER: "Registrazione completata!",
    EVENT_CREATED: "Evento creato con successo!",
    EVENT_UPDATED: "Evento aggiornato con successo!",
    EVENT_DELETED: "Evento eliminato con successo!",
    FAVORITE_ADDED: "Evento aggiunto ai preferiti!",
    FAVORITE_REMOVED: "Evento rimosso dai preferiti!",
    COMMENT_ADDED: "Commento aggiunto con successo!",
    PROFILE_UPDATED: "Profilo aggiornato con successo!",
  },
  ERROR: {
    GENERIC: "Si è verificato un errore. Riprova.",
    NETWORK: "Errore di connessione. Controlla la tua connessione internet.",
    UNAUTHORIZED: "Non sei autorizzato a eseguire questa operazione.",
    NOT_FOUND: "Risorsa non trovata.",
    VALIDATION: "Dati non validi. Controlla i campi inseriti.",
    LOGIN_FAILED: "Email o password non corretti.",
    REGISTER_FAILED: "Errore durante la registrazione.",
    EMAIL_EXISTS: "Email già registrata.",
  },
};
