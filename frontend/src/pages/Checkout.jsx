import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CreditCard, Info, MapPin } from "lucide-react";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import {
  DUMMY_CARD,
  calcTotals,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
  saveCheckoutDraft,
} from "../utils/checkoutPricing";

const Field = ({
  id,
  label,
  value,
  onChange,
  testId,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}) => (
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
      inputMode={inputMode}
      maxLength={maxLength}
      className="block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    />
  </div>
);

const Checkout = () => {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const pricing = calcTotals(total);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [error, setError] = useState("");

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !address || !city || !state || !pincode || !phone) {
      setError("Please fill in all shipping fields");
      return;
    }
    if (!cardName || !cardNumber || !cardExp || !cardCvv) {
      setError("Please fill in all payment fields");
      return;
    }
    if (!isValidCardNumber(cardNumber)) {
      setError("Card number must be 16 digits");
      return;
    }
    if (!isValidExpiry(cardExp)) {
      setError("Expiry must be in MM/YY format");
      return;
    }
    if (!isValidCvv(cardCvv)) {
      setError("CVV must be 3 or 4 digits");
      return;
    }

    const draft = {
      shipping: {
        full_name: fullName,
        address,
        city,
        state,
        pincode,
        phone,
      },
      payment: {
        card_name: cardName.trim(),
        card_number: cardNumber.replace(/\D/g, ""),
        card_exp: cardExp,
        card_cvv: cardCvv,
      },
      items: items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      pricing,
    };

    saveCheckoutDraft(draft);
    navigate("/checkout/review", { state: { draft } });
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
          Enter shipping and payment details, then review before placing the order.
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
                  <Field
                    id="full-name"
                    label="Full name"
                    value={fullName}
                    onChange={setFullName}
                    testId="checkout-name"
                    autoComplete="name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    id="address"
                    label="Address"
                    value={address}
                    onChange={setAddress}
                    testId="checkout-address"
                    autoComplete="street-address"
                  />
                </div>
                <Field
                  id="city"
                  label="City"
                  value={city}
                  onChange={setCity}
                  testId="checkout-city"
                  autoComplete="address-level2"
                />
                <Field
                  id="state"
                  label="State"
                  value={state}
                  onChange={setState}
                  testId="checkout-state"
                  autoComplete="address-level1"
                />
                <Field
                  id="pincode"
                  label="Pincode"
                  value={pincode}
                  onChange={setPincode}
                  testId="checkout-pincode"
                  autoComplete="postal-code"
                />
                <Field
                  id="phone"
                  label="Phone number"
                  value={phone}
                  onChange={setPhone}
                  testId="checkout-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 0100"
                />
              </div>
            </div>

            <div
              data-testid="checkout-payment"
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <CreditCard className="h-4 w-4" /> Payment information
              </h2>

              <div
                data-testid="checkout-payment-info"
                className="mb-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium">
                    Do not enter your personal card details. Use a dummy card for this demo.
                  </p>
                  <p className="mt-1 text-amber-800/90" data-testid="checkout-dummy-card">
                    Example: <span className="font-semibold">{DUMMY_CARD.name}</span>
                    {" · "}
                    <span className="font-mono">{DUMMY_CARD.number}</span>
                    {" · Exp "}
                    <span className="font-mono">{DUMMY_CARD.exp}</span>
                    {" · CVV "}
                    <span className="font-mono">{DUMMY_CARD.cvv}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    id="card-name"
                    label="Name on card"
                    value={cardName}
                    onChange={setCardName}
                    testId="checkout-card-name"
                    autoComplete="cc-name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    id="card-number"
                    label="Card number"
                    value={cardNumber}
                    onChange={(v) => setCardNumber(formatCardNumber(v))}
                    testId="checkout-card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                  />
                </div>
                <Field
                  id="card-exp"
                  label="Expiry (MM/YY)"
                  value={cardExp}
                  onChange={(v) => setCardExp(formatExpiry(v))}
                  testId="checkout-card-exp"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                />
                <Field
                  id="card-cvv"
                  label="CVV"
                  value={cardCvv}
                  onChange={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                  testId="checkout-card-cvv"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                />
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
            <div className="mt-4 space-y-1.5 border-t border-zinc-200 pt-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span data-testid="checkout-subtotal">
                  ${pricing.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span data-testid="checkout-shipping">
                  {pricing.shipping === 0
                    ? "Free"
                    : `$${pricing.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Tax (8%)</span>
                <span data-testid="checkout-tax">${pricing.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900">
              <span>Total</span>
              <span data-testid="checkout-total">
                ${pricing.grandTotal.toFixed(2)}
              </span>
            </div>
            <button
              type="submit"
              data-testid="checkout-continue"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              Continue to review
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
