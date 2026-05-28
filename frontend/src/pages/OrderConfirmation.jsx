import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
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
          className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm"
        >
          <CheckCircle2 className="h-14 w-14 text-emerald-600" />
          <h1
            data-testid="confirmation-title"
            className="text-3xl font-semibold tracking-tight text-zinc-900"
          >
            Thank you for your order!
          </h1>
          <p
            data-testid="confirmation-message"
            className="max-w-md text-sm text-zinc-600"
          >
            Your order has been placed successfully. A confirmation has been
            queued and your items will be on their way shortly.
          </p>

          <div className="mt-4 grid w-full grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
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

          <Link
            to="/products"
            data-testid="back-home-button"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
