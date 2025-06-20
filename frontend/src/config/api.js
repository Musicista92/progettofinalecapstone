// API Configuration
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_CONFIG = {
  BASE_URL: isDevelopment
    ? "http://localhost:5055/api"
    : "https://your-backend-domain.com/api",
  TIMEOUT: 10000,
};

export default API_CONFIG;
