import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .orders()
      .then((data) => active && setOrders(data.orders || []))
      .catch((e) =>
        active &&
        setError(e?.response?.data?.detail || "Failed to load orders"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1
            data-testid="orders-title"
            className="text-3xl font-semibold tracking-tight text-zinc-900"
          >
            My orders
          </h1>
          <p
            data-testid="orders-subtitle"
            className="mt-1 text-sm text-zinc-500"
          >
            Signed in as{" "}
            <span className="font-medium text-zinc-900">{user?.username}</span>
            {" · "}
            <span data-testid="orders-count">
              {loading ? "…" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
            </span>
          </p>
        </header>

        {loading && (
          <div
            data-testid="orders-loading"
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm"
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
          </div>
        )}

        {error && (
          <div
            data-testid="orders-error"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div
            data-testid="orders-empty"
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center"
          >
            <ShoppingBag className="h-10 w-10 text-zinc-300" />
            <p className="text-base font-medium text-zinc-700">No orders yet</p>
            <Link
              to="/products"
              data-testid="orders-shop-now"
              className="mt-2 inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Browse products
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul data-testid="orders-list" className="space-y-4">
            {orders.map((o) => (
              <li
                key={o.id}
                data-testid={`orders-item-${o.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      <span
                        data-testid={`orders-item-id-${o.id}`}
                        className="font-semibold text-zinc-900"
                      >
                        Order #{o.id}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {o.full_name} · {o.city}, {o.state} {o.pincode}
                      {o.created_at && (
                        <> · {new Date(o.created_at).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div
                    data-testid={`orders-item-total-${o.id}`}
                    className="text-lg font-semibold text-zinc-900"
                  >
                    ${Number(o.total).toFixed(2)}
                  </div>
                </div>
                {Array.isArray(o.items) && o.items.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
                    {o.items.map((it, idx) => (
                      <li
                        key={idx}
                        data-testid={`orders-item-${o.id}-line-${it.product_id}`}
                        className="flex justify-between text-zinc-600"
                      >
                        <span>
                          {it.name}{" "}
                          <span className="text-zinc-400">× {it.quantity}</span>
                        </span>
                        <span className="font-medium text-zinc-900">
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
      </main>
    </div>
  );
};

export default Orders;
