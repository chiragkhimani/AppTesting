import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
} from "../utils/checkoutPricing";

const maskCard = (digits) => {
  const d = String(digits || "").replace(/\D/g, "");
  if (d.length < 4) return "••••";
  return `•••• •••• •••• ${d.slice(-4)}`;
};

const ReviewOrder = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const draft = state?.draft || loadCheckoutDraft();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!submitted && (!draft || !draft.shipping || !draft.payment)) {
    return <Navigate to="/checkout" replace />;
  }
  if (!submitted && items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const { shipping, payment, pricing } = draft;
  const lineItems = draft.items?.length
    ? draft.items
    : items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

  const onConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const order = {
        full_name: shipping.full_name,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
        phone: shipping.phone,
        items: lineItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };
      const data = await api.createOrder(order);
      setSubmitted(true);
      clear();
      clearCheckoutDraft();
      const paidTotal = data.total ?? pricing.grandTotal;
      toast.success("Order placed!", {
        description: `Order #${data.order_id} • $${Number(paidTotal).toFixed(2)}`,
      });
      navigate(`/order-confirmation/${data.order_id}`, {
        replace: true,
        state: {
          order_id: data.order_id,
          total: paidTotal,
          subtotal: data.subtotal ?? pricing.subtotal,
          shipping: data.shipping ?? pricing.shipping,
          tax: data.tax ?? pricing.tax,
        },
      });
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Order failed. Try again.";
      setError(detail);
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/checkout"
          data-testid="review-back"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        <h1
          data-testid="review-title"
          className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900"
        >
          Review order
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Confirm shipping, payment, and totals before placing your order.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="col-span-2 space-y-4">
            <div
              data-testid="review-shipping"
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <MapPin className="h-4 w-4" /> Shipping
              </h2>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500">Name</dt>
                  <dd
                    data-testid="review-name"
                    className="font-medium text-zinc-900"
                  >
                    {shipping.full_name}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500">Address</dt>
                  <dd
                    data-testid="review-address"
                    className="font-medium text-zinc-900"
                  >
                    {shipping.address}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">City</dt>
                  <dd data-testid="review-city" className="font-medium text-zinc-900">
                    {shipping.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">State</dt>
                  <dd data-testid="review-state" className="font-medium text-zinc-900">
                    {shipping.state}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Pincode</dt>
                  <dd
                    data-testid="review-pincode"
                    className="font-medium text-zinc-900"
                  >
                    {shipping.pincode}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd data-testid="review-phone" className="font-medium text-zinc-900">
                    {shipping.phone}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              data-testid="review-payment"
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <CreditCard className="h-4 w-4" /> Payment
              </h2>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500">Name on card</dt>
                  <dd
                    data-testid="review-card-name"
                    className="font-medium text-zinc-900"
                  >
                    {payment.card_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Card number</dt>
                  <dd
                    data-testid="review-card-number"
                    className="font-mono font-medium text-zinc-900"
                  >
                    {maskCard(payment.card_number)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Expiry</dt>
                  <dd
                    data-testid="review-card-exp"
                    className="font-mono font-medium text-zinc-900"
                  >
                    {payment.card_exp}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Card details are for demo UI only and are not sent to the server.
              </p>
            </div>

            <div
              data-testid="review-items"
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <Package className="h-4 w-4" /> Items
              </h2>
              <ul className="space-y-2 text-sm">
                {lineItems.map((i) => (
                  <li
                    key={i.product_id}
                    data-testid={`review-item-${i.product_id}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-zinc-700">
                      {i.name}{" "}
                      <span className="text-zinc-400">× {i.quantity}</span>
                    </span>
                    <span className="font-medium text-zinc-900">
                      ${(i.price * i.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div
                data-testid="review-error"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </section>

          <aside
            data-testid="review-summary"
            className="col-span-1 h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Price breakdown
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span data-testid="review-subtotal">
                  ${pricing.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span data-testid="review-shipping-cost">
                  {pricing.shipping === 0
                    ? "Free"
                    : `$${pricing.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Tax (8%)</span>
                <span data-testid="review-tax">${pricing.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-base font-semibold text-zinc-900">
              <span>Order total</span>
              <span data-testid="review-total">
                ${pricing.grandTotal.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              data-testid="checkout-button"
              disabled={submitting}
              onClick={onConfirm}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ReviewOrder;
