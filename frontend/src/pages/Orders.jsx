import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

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

  const onCancel = async (orderId) => {
    if (cancellingId) return;
    const confirmed = window.confirm(
      `Cancel order #${orderId}? This cannot be undone.`
    );
    if (!confirmed) return;

    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
      toast.success(`Order #${orderId} cancelled`);
    } catch (e) {
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Failed to cancel order";
      toast.error(detail);
    } finally {
      setCancellingId(null);
    }
  };

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
            {orders.map((o) => {
              const status = o.status || "pending";
              const isCancelled = status === "cancelled";
              const isCancelling = cancellingId === o.id;
              return (
                <li
                  key={o.id}
                  data-testid={`orders-item-${o.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-600" />
                        <span
                          data-testid={`orders-item-id-${o.id}`}
                          className="font-semibold text-zinc-900"
                        >
                          Order #{o.id}
                        </span>
                        <span
                          data-testid={`orders-item-status-${o.id}`}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isCancelled
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {o.full_name} · {o.city}, {o.state} {o.pincode}
                        {o.created_at && (
                          <> · {new Date(o.created_at).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div
                        data-testid={`orders-item-total-${o.id}`}
                        className="text-lg font-semibold text-zinc-900"
                      >
                        ${Number(o.total).toFixed(2)}
                      </div>
                      {!isCancelled && (
                        <button
                          type="button"
                          data-testid={`orders-cancel-${o.id}`}
                          disabled={!!cancellingId}
                          onClick={() => onCancel(o.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCancelling && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {isCancelling ? "Cancelling…" : "Cancel order"}
                        </button>
                      )}
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
                  <div
                    data-testid={`orders-item-breakdown-${o.id}`}
                    className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-600"
                  >
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span data-testid={`orders-item-subtotal-${o.id}`}>
                        ${Number(o.subtotal ?? o.total).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span data-testid={`orders-item-shipping-${o.id}`}>
                        {Number(o.shipping ?? 0) === 0
                          ? "Free"
                          : `$${Number(o.shipping).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span data-testid={`orders-item-tax-${o.id}`}>
                        ${Number(o.tax ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-semibold text-zinc-900">
                      <span>Total</span>
                      <span>${Number(o.total).toFixed(2)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Orders;
