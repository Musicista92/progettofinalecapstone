import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    description: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1574391884720-bbc1b1b4c2b6?w=800&h=400&fit=crop",
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
    },
    location: {
      venue: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      region: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    danceStyle: {
      type: String,
      enum: ["salsa", "bachata", "kizomba", "merengue", "reggaeton", "altro"],
      required: true,
    },
    skillLevel: {
      type: String,
      enum: [
        "tutti",
        "principiante",
        "intermedio",
        "avanzato",
        "professionista",
      ],
      default: "tutti",
    },
    eventType: {
      type: String,
      enum: ["workshop", "social", "festival", "competizione", "corso"],
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    maxParticipants: {
      type: Number,
      min: 1,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
      },
    ],
    gallery: [
      {
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    requirements: {
      type: String,
      maxLength: 500,
    },
    contactInfo: {
      phone: String,
      email: String,
      whatsapp: String,
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      website: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
eventSchema.index({ title: "text", description: "text" });
eventSchema.index({ dateTime: 1 });
eventSchema.index({ danceStyle: 1 });
eventSchema.index({ "location.city": 1 });
eventSchema.index({ status: 1 });

export default mongoose.model("Event", eventSchema);
