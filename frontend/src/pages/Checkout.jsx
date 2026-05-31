import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

const Field = ({ id, label, value, onChange, testId, type = "text", placeholder, autoComplete }) => (
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
      autoComplete={autoComplete}
      className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    />
  </div>
);

const Checkout = () => {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!submitted && items.length === 0) return <Navigate to="/cart" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName || !address || !city || !state || !pincode || !phone) {
      setError("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const order = {
        full_name: fullName,
        address,
        city,
        state,
        pincode,
        phone,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };
      const data = await api.createOrder(order);
      setSubmitted(true);
      clear();
      toast.success("Order placed!", {
        description: `Order #${data.order_id} • $${data.total.toFixed(2)}`,
      });
      navigate(`/order-confirmation/${data.order_id}`, {
        replace: true,
        state: { order_id: data.order_id, total: data.total },
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
        <h1
          data-testid="checkout-title"
          className="text-3xl font-semibold tracking-tight text-zinc-900"
        >
          Checkout
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Where should we deliver your order?
        </p>

        <form
          onSubmit={onSubmit}
          data-testid="checkout-form"
          className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <section className="col-span-2 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <MapPin className="h-4 w-4" /> Shipping details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="full-name" label="Full name" value={fullName} onChange={setFullName} testId="checkout-name" autoComplete="name" />
                </div>
                <div className="sm:col-span-2">
                  <Field id="address" label="Address" value={address} onChange={setAddress} testId="checkout-address" autoComplete="street-address" />
                </div>
                <Field id="city" label="City" value={city} onChange={setCity} testId="checkout-city" autoComplete="address-level2" />
                <Field id="state" label="State" value={state} onChange={setState} testId="checkout-state" autoComplete="address-level1" />
                <Field id="pincode" label="Pincode" value={pincode} onChange={setPincode} testId="checkout-pincode" autoComplete="postal-code" />
                <Field id="phone" label="Phone number" value={phone} onChange={setPhone} testId="checkout-phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" />
              </div>
            </div>

            {error && (
              <div
                data-testid="checkout-error"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </section>
          

          <aside
            data-testid="checkout-summary"
            className="col-span-1 h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Order summary
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li
                  key={i.product_id}
                  data-testid={`checkout-item-${i.product_id}`}
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
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-base font-semibold text-zinc-900">
              <span>Total</span>
              <span data-testid="checkout-total">${total.toFixed(2)}</span>
            </div>
            <button
              type="submit"
              data-testid="checkout-button"
              disabled={submitting}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
