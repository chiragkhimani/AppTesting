import axios from "axios";
import { API_BASE } from "../config";

const STORAGE_TOKEN = "qa_demo_token";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(STORAGE_TOKEN);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const setToken = (token) => {
  if (token) localStorage.setItem(STORAGE_TOKEN, token);
  else localStorage.removeItem(STORAGE_TOKEN);
};

export const getToken = () => localStorage.getItem(STORAGE_TOKEN);

/**
 * NOTE: As of the .htaccess update, the canonical API URLs are extensionless
 * (e.g. /api/products instead of /api/products.php). The Apache rewrite rule
 * + FastAPI mirror aliases keep the old .php paths working for backward
 * compatibility, but the frontend now uses the cleaner form.
 */
export const api = {
  // Public
  login: (username, password) =>
    http.post("/auth/login", { username, password }).then((r) => r.data),
  forgotPassword: (payload) =>
    http.post("/auth/forgot-password", payload).then((r) => r.data),
  signup: (payload) =>
    http.post("/signup", payload).then((r) => r.data),
  products: () => http.get("/products").then((r) => r.data),
  product: (id) =>
    http.get("/products", { params: { id } }).then((r) => r.data),
  // Protected
  profile: () => http.get("/profile").then((r) => r.data),
  orders: (userId) =>
    http
      .get("/orders", userId ? { params: { user_id: userId } } : undefined)
      .then((r) => r.data),
  createOrder: (order) =>
    http.post("/orders", order).then((r) => r.data),
  cancelOrder: (orderId) =>
    http.post("/cancel-order", { order_id: orderId }).then((r) => r.data),
};

export default http;
