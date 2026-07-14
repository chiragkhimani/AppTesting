// API base URL.
// - In local development, we hit the FastAPI mirror at REACT_APP_BACKEND_URL/api
// - On Hostinger production, the app lives at /playground and PHP at /playground/api.
//   Set REACT_APP_API_BASE="/playground/api" before `yarn build` for Hostinger.
const ENV_BASE = process.env.REACT_APP_API_BASE;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const API_BASE = ENV_BASE
  ? ENV_BASE.replace(/\/$/, "")
  : `${(BACKEND_URL || "").replace(/\/$/, "")}/api`;
