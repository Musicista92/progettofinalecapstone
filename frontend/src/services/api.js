import { API_CONFIG } from "../config/api.js";

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper function to create headers
const createHeaders = () => {
  const headers = {}; // Rimosso Content-Type di default
  const token = localStorage.getItem("authToken");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders();

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const config = { headers, ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// Authentication API
const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
      includeAuth: false,
    });

    // Store token if registration successful
    if (response.success && response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      includeAuth: false,
    });

    // Store token if login successful
    if (response.success && response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiCall("/auth/me");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiCall("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiCall("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
    return response.data;
  },

  // Logout (client-side)
  logout: () => {
    localStorage.removeItem("authToken");
    return Promise.resolve();
  },
};

// Users API
const usersAPI = {
  // Get all users with search and pagination
  getUsers: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/users?${searchParams}` : "/users";
    const response = await apiCall(endpoint, { includeAuth: false });
    return response.data;
  },

  // Get user by ID
  getById: async (userId) => {
    const response = await apiCall(`/users/${userId}`, { includeAuth: false });
    return response.data;
  },

  // Follow/Unfollow user
  toggleFollow: async (userId) => {
    const response = await apiCall(`/users/${userId}/follow`, {
      method: "POST",
    });
    return response.data;
  },

  // Get user followers
  getFollowers: async (userId) => {
    const response = await apiCall(`/users/${userId}/followers`, {
      includeAuth: false,
    });
    return response.data;
  },

  // Get user following
  getFollowing: async (userId) => {
    const response = await apiCall(`/users/${userId}/following`, {
      includeAuth: false,
    });
    return response.data;
  },

  // Get user's favourite events (public)
  getFavourites: async (userId, params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/users/${userId}/favourites?${searchParams}`
      : `/users/${userId}/favourites`;
    const response = await apiCall(endpoint, { includeAuth: false });
    return response.data;
  },
};

// Events API
const eventsAPI = {
  // Get all events with filters
  getAll: async (filters = {}) => {
    const searchParams = new URLSearchParams(filters).toString();
    const endpoint = searchParams ? `/events?${searchParams}` : "/events";
    const response = await apiCall(endpoint, { includeAuth: false });

    // Adatta la risposta al formato atteso dal frontend
    return {
      data: response.data.events,
      total: response.data.pagination.total,
    };
  },

  // Get event by ID
  getById: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}`, {
      includeAuth: false,
    });
    return response.data.event;
  },

  // Create new event
  create: async (eventData) => {
    const response = await apiCall("/events", {
      method: "POST",
      body: eventData,
    });
    return response.data;
  },

  // Update event
  update: async (eventId, eventData) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
    return response.data;
  },

  // Delete event
  delete: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}`, {
      method: "DELETE",
    });
    return response.data;
  },

  // Join/Leave event
  toggleParticipation: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/participate`, {
      method: "POST",
    });

    // Restituisci l'evento aggiornato - chiama getById per ottenere i dati completi
    return await eventsAPI.getById(eventId);
  },

  //  Add/Remove event from favourites
  toggleFavourite: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/favourite`, {
      method: "POST",
    });
    return response.data;
  },

  // Get my events (as organizer)
  getMyEvents: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/events/organizer/my-events?${searchParams}`
      : "/events/organizer/my-events";
    const response = await apiCall(endpoint);
    return response.data;
  },

  // Get joined events
  getJoinedEvents: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/events/user/joined?${searchParams}`
      : "/events/user/joined";
    const response = await apiCall(endpoint);
    return response.data;
  },

  // Get favourite events
  getFavouriteEvents: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/events/user/favourites?${searchParams}`
      : "/events/user/favourites";
    const response = await apiCall(endpoint);
    return response.data;
  },

  // Update event status (admin only)
  updateStatus: async (eventId, statusData) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
    return response.data;
  },
};

const commentsAPI = {
  // Get comments for an event
  getEventComments: async (eventId, params = {}) => {
    if (!eventId) {
      console.warn("Event ID is missing for comments");
      return { comments: [], pagination: { total: 0, page: 1, pages: 0 } };
    }

    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/comments/events/${eventId}/comments?${searchParams}`
      : `/comments/events/${eventId}/comments`;

    try {
      const response = await apiCall(endpoint, { includeAuth: false });
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Restituisci una struttura vuota in caso di errore
      return { comments: [], pagination: { total: 0, page: 1, pages: 0 } };
    }
  },

  // Add comment to event
  add: async (eventId, commentData) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/comments/events/${eventId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
    return response.data.comment;
  },

  // Toggle like on comment
  toggleLike: async (commentId) => {
    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    const response = await apiCall(`/comments/${commentId}/like`, {
      method: "POST",
    });
    return response.data;
  },
};

const favoritesAPI = {
  // Get user's favorite events
  get: async (params = {}) => {
    try {
      const response = await apiCall("/events/user/favourites", {
        method: "GET",
        ...params,
      });
      return response.data.events || [];
    } catch (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }
  },

  // Add event to favorites
  add: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/favourite`, {
      method: "POST",
    });
    return response.data;
  },

  // Remove from favorites
  remove: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    // La stessa API gestisce sia add che remove (toggle)
    const response = await apiCall(`/events/${eventId}/favourite`, {
      method: "POST",
    });
    return response.data;
  },

  // Toggle favourite status
  toggle: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/favourite`, {
      method: "POST",
    });
    return response.data;
  },

  // Check if event is in favorites (viene gestito dal getById dell'evento)
  check: async (eventId) => {
    if (!eventId) {
      return false;
    }

    try {
      const event = await eventsAPI.getById(eventId);
      return event.isFavourite || false;
    } catch (error) {
      console.error("Error checking favorites:", error);
      return false;
    }
  },
};

// Stats API
const statsAPI = {
  getDashboard: async () => {
    try {
      const response = await apiCall("/admin/stats");

      // Adatta il formato per il frontend
      return {
        totalEvents: response.data.events?.total || 0,
        totalUsers: response.data.users?.total || 0,
        totalAttendees: response.data.engagement?.totalParticipations || 0,
        avgRating: response.data.engagement?.avgRating || 0,
        upcomingEvents: response.data.events?.approved || 0,
        pendingApprovals: response.data.events?.pending || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalEvents: 0,
        totalUsers: 0,
        totalAttendees: 0,
        avgRating: 0,
        upcomingEvents: 0,
        pendingApprovals: 0,
      };
    }
  },
};

const adminAPI = {
  // Get pending events
  getPendingEvents: async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams
      ? `/admin/pending-events?${searchParams}`
      : "/admin/pending-events";
    const response = await apiCall(endpoint);
    return response.data.events || [];
  },

  // Approve event
  approveEvent: async (eventId) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "approved" }),
    });
    return response.data.event;
  },

  // Reject event
  rejectEvent: async (eventId, reason) => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await apiCall(`/events/${eventId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status: "rejected",
        rejectionReason: reason,
      }),
    });
    return response.data;
  },
  updateUser: async (userId, userData) => {
    if (!userId) throw new Error("User ID is required");
    return await apiCall(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (userId) => {
    if (!userId) throw new Error("User ID is required");
    return await apiCall(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  },
};

const notificationsAPI = {
  // GET /api/notifications
  get: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams(params).toString();
      const endpoint = searchParams
        ? `/notifications?${searchParams}`
        : "/notifications";
      const response = await apiCall(endpoint);
      return response.data; // Restituisce { notifications, unreadCount, pagination }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        notifications: [],
        unreadCount: 0,
        pagination: { total: 0, page: 1, pages: 0 },
      };
    }
  },

  // PUT /api/notifications/:id/read
  markAsRead: async (notificationId) => {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    return await apiCall(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  // PUT /api/notifications/read-all
  markAllAsRead: async () => {
    return await apiCall("/notifications/read-all", {
      method: "PUT",
    });
  },

  // DELETE /api/notifications/:id
  delete: async (notificationId) => {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    return await apiCall(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

// Export the complete API service
export const apiService = {
  auth: authAPI,
  users: usersAPI,
  events: eventsAPI,
  comments: commentsAPI,
  favorites: favoritesAPI,
  stats: statsAPI,
  admin: adminAPI,
  notifications: notificationsAPI,
};

// Export individual APIs for convenience
export { authAPI, usersAPI, eventsAPI };

export default apiService;
