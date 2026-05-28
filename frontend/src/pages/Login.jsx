import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Package } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/products" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(username, password);
      login(data.user);
      navigate("/products", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setError(detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            QA Demo Store
          </h1>
          <p className="text-sm text-zinc-500">
            Sign in to start automating
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          data-testid="login-form"
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-zinc-700"
            >
              Username
            </label>
            <input
              id="username"
              data-testid="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="standard_user"
              className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              id="password"
              data-testid="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="secret_sauce"
              className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error && (
            <div
              data-testid="login-error"
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            data-testid="login-button"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div
          data-testid="login-credentials"
          className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600"
        >
          <div className="mb-2 font-semibold uppercase tracking-wide text-zinc-500">
            Accepted users
          </div>
          <ul className="space-y-1 font-mono">
            <li>standard_user</li>
            <li>locked_out_user</li>
            <li>problem_user</li>
          </ul>
          <div className="mt-3 mb-1 font-semibold uppercase tracking-wide text-zinc-500">
            Password (all users)
          </div>
          <div className="font-mono">secret_sauce</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
