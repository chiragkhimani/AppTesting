import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../components/Header";

const OrderConfirmation = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const total = state?.total;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div
          data-testid="order-confirmation"
          className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-xl shadow-emerald-100/30"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

          <h1
            data-testid="order-success-message"
            className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900"
          >
            <span>Your order has been placed</span>
          </h1>
          <p
            data-testid="confirmation-message"
            className="max-w-md text-sm text-zinc-600"
          >
            Thanks for shopping the QA Demo Store! A confirmation has been
            queued and your items will be on their way shortly.
          </p>

          <div className="mt-2 grid w-full grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Order number
              </div>
              <div
                data-testid="order-number"
                className="mt-1 text-lg font-semibold text-zinc-900"
              >
                #{id}
              </div>
            </div>
            {typeof total === "number" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total paid
                </div>
                <div
                  data-testid="order-total"
                  className="mt-1 text-lg font-semibold text-zinc-900"
                >
                  ${total.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              data-testid="back-home-button"
              className="inline-flex h-11 items-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
