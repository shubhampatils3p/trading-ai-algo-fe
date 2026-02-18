import axios from "axios";

const api = axios.create({
  baseURL: "https://algopilot-q07h.onrender.com", // or laptop IP
  timeout: 5000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔐 Handle expired / invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload(); // force logout
    }
    return Promise.reject(error);
  }
);

export default api;
