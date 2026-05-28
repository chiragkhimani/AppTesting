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

export const api = {
  login: (username, password) =>
    http.post("/auth/login.php", { username, password }).then((r) => r.data),
  products: () => http.get("/products.php").then((r) => r.data),
  product: (id) =>
    http.get("/products.php", { params: { id } }).then((r) => r.data),

  // Protected
  users: () => http.get("/users.php").then((r) => r.data),
  createUser: (payload) =>
    http.post("/users.php", payload).then((r) => r.data),
  orders: (userId) =>
    http
      .get("/orders.php", userId ? { params: { user_id: userId } } : undefined)
      .then((r) => r.data),
  createOrder: (order) =>
    http.post("/orders.php", order).then((r) => r.data),
};

export default http;
