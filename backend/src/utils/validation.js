import { body } from "express-validator";

// User Registration Validation
export const validateRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve essere tra 2 e 100 caratteri"),

  body("email").isEmail().normalizeEmail().withMessage("Email non valida"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password deve essere almeno 6 caratteri"),

  body("role")
    .optional()
    .isIn(["user", "organizer"])
    .withMessage("Ruolo non valido"),
];

// User Login Validation
export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Email non valida"),

  body("password").notEmpty().withMessage("Password richiesta"),
];

// Profile Update Validation
export const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve essere tra 2 e 100 caratteri"),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio non può superare 500 caratteri"),

  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar deve essere un URL valido"),

  body("preferences.danceStyles")
    .optional()
    .isArray()
    .withMessage("Stili di danza devono essere un array"),

  body("preferences.danceStyles.*")
    .optional()
    .isIn(["salsa", "bachata", "kizomba", "merengue", "reggaeton", "altro"])
    .withMessage("Stile di danza non valido"),

  body("preferences.skillLevel")
    .optional()
    .isIn(["principiante", "intermedio", "avanzato", "professionista"])
    .withMessage("Livello di competenza non valido"),

  body("location.city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Città non può superare 100 caratteri"),

  body("location.region")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Regione non può superare 100 caratteri"),
];

// Password Change Validation
export const validatePasswordChange = [
  body("currentPassword").notEmpty().withMessage("Password attuale richiesta"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Nuova password deve essere almeno 6 caratteri")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Nuova password deve contenere almeno una maiuscola, una minuscola e un numero"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Conferma password non corrisponde");
    }
    return true;
  }),
];

// ==================== EVENT VALIDATIONS ====================

// Event Creation/Update Validation
export const validateEvent = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Titolo deve essere tra 5 e 200 caratteri"),

  body("description")
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Descrizione deve essere tra 20 e 2000 caratteri"),

  body("image")
    .optional()
    .isURL()
    .withMessage("Immagine deve essere un URL valido"),

  body("dateTime")
    .isISO8601()
    .toDate()
    .withMessage("Data e ora non valide")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Data e ora devono essere nel futuro");
      }
      return true;
    }),

  body("endDateTime")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Data e ora di fine non valide")
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.dateTime)) {
        throw new Error("Data di fine deve essere dopo la data di inizio");
      }
      return true;
    }),

  body("location").customSanitizer((value) => {
    try {
      // Se il valore è una stringa JSON valida, la parsiamo
      return JSON.parse(value);
    } catch (e) {
      // Altrimenti, restituiamo il valore originale per far fallire le prossime validazioni
      return value;
    }
  }),

  body("location.venue")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Nome venue deve essere tra 2 e 200 caratteri"),
  body("location.address")
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage("Indirizzo deve essere tra 5 e 300 caratteri"),
  body("location.city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Città deve essere tra 2 e 100 caratteri"),

  body("danceStyle")
    .isIn(["salsa", "bachata", "kizomba", "merengue", "reggaeton", "altro"])
    .withMessage("Stile di danza non valido"),

  body("skillLevel")
    .isIn(["tutti", "principiante", "intermedio", "avanzato", "professionista"])
    .withMessage("Livello di competenza non valido"),

  body("eventType")
    .isIn(["workshop", "social", "festival", "competizione", "corso"])
    .withMessage("Tipo di evento non valido"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Prezzo deve essere un numero maggiore o uguale a 0"),

  body("maxParticipants")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Numero massimo partecipanti deve essere almeno 1"),

  body("tags")
    .optional()
    .customSanitizer((value) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    })
    // Ora isArray() funzionerà sul valore trasformato
    .isArray()
    .withMessage("Tags deve essere un array"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Ogni tag deve essere tra 1 e 30 caratteri"),

  body("requirements")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Requisiti non possono superare 500 caratteri"),

  body("contactInfo.phone")
    .optional()
    .isMobilePhone("it-IT")
    .withMessage("Numero di telefono non valido"),

  body("contactInfo.email")
    .optional()
    .isEmail()
    .withMessage("Email di contatto non valida"),

  body("contactInfo.whatsapp")
    .optional()
    .isMobilePhone("it-IT")
    .withMessage("Numero WhatsApp non valido"),
];

// Event Status Update Validation (for admins)
export const validateEventStatus = [
  body("status")
    .isIn(["pending", "approved", "rejected", "cancelled"])
    .withMessage("Status non valido"),

  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .notEmpty()
    .withMessage("Motivo del rifiuto richiesto quando si rifiuta un evento"),
];

// Comment validation
export const validateComment = [
  // Valida 'content' solo se il campo 'rating' non è presente o è vuoto.
  body("content")
    .if(body("rating").not().exists({ checkFalsy: true }))
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Il commento è richiesto se non fornisci una valutazione."),

  // Valida 'rating' come opzionale.
  // checkFalsy: true assicura che valori come 0, null, "" vengano considerati "assenti"
  body("rating")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage("La valutazione deve essere un numero intero tra 1 e 5."),

  body("parentComment")
    .optional()
    .isMongoId()
    .withMessage("ID commento padre non valido"),
];

export const validateCommentUpdate = [
  // Il contenuto deve esistere se non c'è rating valido
  body("content")
    .if(body("rating").not().exists({ checkFalsy: true }))
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Il commento è richiesto se non fornisci una valutazione."),

  // Content validation generale (se presente)
  body("content")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Il commento non può superare i 1000 caratteri"),

  // Rating validation che considera 0 come "non fornito"
  body("rating")
    .optional({ checkFalsy: true }) // checkFalsy: true considera 0, null, undefined, "" come "non fornito"
    .isInt({ min: 1, max: 5 })
    .withMessage("La valutazione deve essere tra 1 e 5"),
];