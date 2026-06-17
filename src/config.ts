// API base URL - tuỳ chỉnh theo environment
// Dev: http://localhost:8000
// Prod: https://api.yourdomain.com
export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
