import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/products" replace />;

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(username, password);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}`);
      navigate("/products", { replace: true });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Login failed. Please try again.";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password || !confirmPassword) {
      setError("Username, new password and confirm password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }
    setLoading(true);
    try {
      const data = await api.forgotPassword({
        username,
        password,
        confirm_password: confirmPassword,
      });
      toast.success(data.message || "Password updated successfully");
      switchMode("login");
      setPassword("");
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Could not update password. Please try again.";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-emerald-50/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            QA Demo Store
          </h1>
          <p className="text-sm text-zinc-500">
            {mode === "login" ? "Sign in to your account" : "Set a new password"}
          </p>
        </div>

        {mode === "login" ? (
          <form
            onSubmit={onLogin}
            data-testid="login-form"
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-zinc-700">
                Username
              </label>
              <input
                id="username"
                data-testid="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </label>
                <button
                  type="button"
                  data-testid="forgot-password-link"
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                data-testid="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="pt-2 text-center text-sm text-zinc-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                data-testid="signup-link"
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        ) : (
          <form
            onSubmit={onForgotPassword}
            data-testid="forgot-password-form"
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-1.5">
              <label htmlFor="forgot-username" className="text-sm font-medium text-zinc-700">
                Username
              </label>
              <input
                id="forgot-username"
                data-testid="forgot-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="forgot-password" className="text-sm font-medium text-zinc-700">
                New password
              </label>
              <input
                id="forgot-password"
                data-testid="forgot-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="forgot-confirm-password" className="text-sm font-medium text-zinc-700">
                Confirm password
              </label>
              <input
                id="forgot-confirm-password"
                data-testid="forgot-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <div
                data-testid="forgot-password-error"
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="forgot-password-submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Update password"}
            </button>

            <div className="pt-2 text-center text-sm text-zinc-600">
              <button
                type="button"
                data-testid="forgot-back-to-login"
                onClick={() => switchMode("login")}
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
