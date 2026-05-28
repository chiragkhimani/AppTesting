import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

const Field = ({ id, label, value, onChange, testId, type = "text", placeholder }) => (
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
      className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    />
  </div>
);

const Checkout = () => {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !firstName || !lastName || !address || !city || !zipcode ||
      !cardName || !cardNumber || !cardExp || !cardCvv
    ) {
      setError("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const order = {
        user_id: user?.id,
        first_name: firstName,
        last_name: lastName,
        address,
        city,
        zipcode,
        total: Number(total.toFixed(2)),
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };
      const data = await api.createOrder(order);
      clear();
      navigate(`/order-confirmation/${data.order_id}`, {
        replace: true,
        state: { order_id: data.order_id, total: data.total },
      });
    } catch (err) {
      setError(err?.response?.data?.detail || "Order failed. Try again.");
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

        <form
          onSubmit={onSubmit}
          data-testid="checkout-form"
          className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="col-span-2 space-y-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Shipping
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="firstName" label="First name" value={firstName} onChange={setFirstName} testId="checkout-first-name" placeholder="John" />
                <Field id="lastName" label="Last name" value={lastName} onChange={setLastName} testId="checkout-last-name" placeholder="Doe" />
                <div className="sm:col-span-2">
                  <Field id="address" label="Address" value={address} onChange={setAddress} testId="checkout-address" placeholder="123 Main St" />
                </div>
                <Field id="city" label="City" value={city} onChange={setCity} testId="checkout-city" placeholder="San Francisco" />
                <Field id="zipcode" label="Zip / Postal code" value={zipcode} onChange={setZipcode} testId="checkout-zipcode" placeholder="94103" />
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Payment (mock)
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="cardName" label="Name on card" value={cardName} onChange={setCardName} testId="checkout-card-name" placeholder="John Doe" />
                </div>
                <div className="sm:col-span-2">
                  <Field id="cardNumber" label="Card number" value={cardNumber} onChange={setCardNumber} testId="checkout-card-number" placeholder="4242 4242 4242 4242" />
                </div>
                <Field id="cardExp" label="Expiration (MM/YY)" value={cardExp} onChange={setCardExp} testId="checkout-card-exp" placeholder="04/27" />
                <Field id="cardCvv" label="CVV" value={cardCvv} onChange={setCardCvv} testId="checkout-card-cvv" placeholder="123" />
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                This is a demo. No real payment will be processed.
              </p>
            </section>

            {error && (
              <div
                data-testid="checkout-error"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          <aside
            data-testid="checkout-summary"
            className="col-span-1 h-fit rounded-xl border border-zinc-200 bg-white p-5"
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
              data-testid="place-order-button"
              disabled={submitting}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
