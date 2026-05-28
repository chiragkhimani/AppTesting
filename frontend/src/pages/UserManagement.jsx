import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, UserPlus } from "lucide-react";
import { api } from "../api/client";
import Header from "../components/Header";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // expanded user's orders
  const [openUserId, setOpenUserId] = useState(null);
  const [ordersByUser, setOrdersByUser] = useState({});
  const [ordersLoading, setOrdersLoading] = useState({});

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.users();
      setUsers(data.users || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!username || !password || !email) {
      setFormError("Username, password and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.createUser({
        username,
        password,
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
      setFormSuccess(`User "${data.user.username}" created (id #${data.user.id})`);
      setUsername("");
      setPassword("");
      setEmail("");
      setFirstName("");
      setLastName("");
      await loadUsers();
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOrders = async (userId) => {
    if (openUserId === userId) {
      setOpenUserId(null);
      return;
    }
    setOpenUserId(userId);
    if (ordersByUser[userId]) return;
    setOrdersLoading((s) => ({ ...s, [userId]: true }));
    try {
      const data = await api.orders(userId);
      setOrdersByUser((s) => ({ ...s, [userId]: data.orders || [] }));
    } catch (e) {
      setOrdersByUser((s) => ({ ...s, [userId]: [] }));
    } finally {
      setOrdersLoading((s) => ({ ...s, [userId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1
            data-testid="user-management-title"
            className="text-3xl font-semibold tracking-tight text-zinc-900"
          >
            User Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create new users and inspect order history.
          </p>
        </div>

        <section
          data-testid="create-user-form"
          className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <UserPlus className="h-4 w-4" /> Add new user
          </h2>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="cu-username" label="Username *" value={username} onChange={setUsername}
                   placeholder="alice" testId="create-user-username" />
            <Input id="cu-email" label="Email *" type="email" value={email} onChange={setEmail}
                   placeholder="alice@example.com" testId="create-user-email" />
            <Input id="cu-password" label="Password *" type="password" value={password} onChange={setPassword}
                   placeholder="Min 4 characters" testId="create-user-password" />
            <Input id="cu-first" label="First name" value={firstName} onChange={setFirstName}
                   placeholder="Alice" testId="create-user-first-name" />
            <Input id="cu-last" label="Last name" value={lastName} onChange={setLastName}
                   placeholder="Smith" testId="create-user-last-name" />

            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                data-testid="create-user-button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating…" : "Create user"}
              </button>
            </div>

            {formError && (
              <div
                data-testid="create-user-error"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2"
              >
                {formError}
              </div>
            )}
            {formSuccess && (
              <div
                data-testid="create-user-success"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2"
              >
                {formSuccess}
              </div>
            )}
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              All users
            </h2>
            <span className="text-xs text-zinc-500">{users.length} total</span>
          </header>

          {loading && (
            <div className="flex items-center gap-2 p-6 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
            </div>
          )}

          {error && (
            <div
              data-testid="users-error"
              className="m-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <ul data-testid="user-list" className="divide-y divide-zinc-100">
              {users.map((u) => {
                const open = openUserId === u.id;
                const userOrders = ordersByUser[u.id];
                const isLoadingOrders = ordersLoading[u.id];
                return (
                  <li
                    key={u.id}
                    data-testid={`user-row-${u.id}`}
                    className="px-6 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            data-testid={`user-username-${u.id}`}
                            className="font-semibold text-zinc-900"
                          >
                            {u.username}
                          </span>
                          <span className="text-xs text-zinc-400">#{u.id}</span>
                          {u.locked && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              locked
                            </span>
                          )}
                        </div>
                        <div
                          data-testid={`user-email-${u.id}`}
                          className="mt-0.5 text-sm text-zinc-500"
                        >
                          {u.email || "—"}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrders(u.id)}
                        data-testid={`view-orders-${u.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        {open ? (
                          <>
                            <ChevronUp className="h-4 w-4" /> Hide orders
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" /> View orders
                          </>
                        )}
                      </button>
                    </div>

                    {open && (
                      <div
                        data-testid={`user-order-history-${u.id}`}
                        className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4"
                      >
                        {isLoadingOrders && (
                          <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
                          </div>
                        )}
                        {!isLoadingOrders && userOrders && userOrders.length === 0 && (
                          <div
                            data-testid={`user-no-orders-${u.id}`}
                            className="text-sm text-zinc-500"
                          >
                            No orders yet.
                          </div>
                        )}
                        {!isLoadingOrders && userOrders && userOrders.length > 0 && (
                          <ul className="space-y-3">
                            {userOrders.map((o) => (
                              <li
                                key={o.id}
                                data-testid={`order-${o.id}`}
                                className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-zinc-900">
                                    Order #{o.id}
                                  </span>
                                  <span className="font-medium text-zinc-900">
                                    ${Number(o.total).toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-zinc-500">
                                  {o.first_name} {o.last_name} · {o.city},{" "}
                                  {o.zipcode}
                                  {o.created_at && (
                                    <> · {new Date(o.created_at).toLocaleString()}</>
                                  )}
                                </div>
                                {Array.isArray(o.items) && o.items.length > 0 && (
                                  <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                                    {o.items.map((it, idx) => (
                                      <li
                                        key={idx}
                                        data-testid={`order-${o.id}-item-${it.product_id}`}
                                        className="flex justify-between"
                                      >
                                        <span>
                                          {it.name}{" "}
                                          <span className="text-zinc-400">
                                            × {it.quantity}
                                          </span>
                                        </span>
                                        <span>
                                          ${(it.price * it.quantity).toFixed(2)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

const Input = ({ id, label, value, onChange, testId, type = "text", placeholder }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium text-zinc-700">
      {label}
    </label>
    <input
      id={id}
      data-testid={testId}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    />
  </div>
);

export default UserManagement;
