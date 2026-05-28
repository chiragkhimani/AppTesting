import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Package, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/products" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.signup({ username, email, password });
      toast.success("Account created successfully", {
        description: "Please sign in with your new credentials.",
      });
      navigate("/login", {
        replace: true,
        state: { signupSuccess: true, username },
      });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Sign up failed. Please try again.";
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
          <h1
            data-testid="signup-title"
            className="text-2xl font-semibold tracking-tight text-zinc-900"
          >
            Create your account
          </h1>
          <p className="text-sm text-zinc-500">
            Join in seconds — no payment, no spam.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          data-testid="signup-form"
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="su-username" className="text-sm font-medium text-zinc-700">
              Username
            </label>
            <input
              id="su-username"
              data-testid="signup-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="su-email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="su-email"
              data-testid="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="su-password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="su-password"
              data-testid="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-zinc-500">Minimum 6 characters.</p>
          </div>

          {error && (
            <div
              data-testid="signup-error"
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            data-testid="signup-button"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Creating account…" : "Create account"}
          </button>

          <div className="pt-2 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              to="/login"
              data-testid="back-to-login-link"
              className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
