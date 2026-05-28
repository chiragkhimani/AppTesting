import axios from "axios";
import { API_BASE } from "../config";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  login: (username, password) =>
    http.post("/login.php", { username, password }).then((r) => r.data),
  users: () => http.get("/users.php").then((r) => r.data),
  products: () => http.get("/products.php").then((r) => r.data),
  product: (id) =>
    http.get("/products.php", { params: { id } }).then((r) => r.data),
  createOrder: (order) =>
    http.post("/orders.php", order).then((r) => r.data),
};

export default http;
