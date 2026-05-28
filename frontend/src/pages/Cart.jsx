import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

const Cart = () => {
  const { items, remove, updateQty, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1
          data-testid="cart-title"
          className="text-3xl font-semibold tracking-tight text-zinc-900"
        >
          Your cart
        </h1>

        {items.length === 0 ? (
          <div
            data-testid="cart-empty"
            className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center"
          >
            <ShoppingBag className="h-10 w-10 text-zinc-300" />
            <p className="text-base font-medium text-zinc-700">
              Your cart is empty
            </p>
            <Link
              to="/products"
              data-testid="continue-shopping"
              className="mt-2 inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <ul
              data-testid="cart-items"
              className="col-span-2 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              {items.map((i) => (
                <li
                  key={i.product_id}
                  data-testid={`cart-item-${i.product_id}`}
                  className="flex items-center gap-4 p-4"
                >
                  <img
                    src={i.image_url}
                    alt={i.name}
                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <div
                      data-testid={`cart-item-name-${i.product_id}`}
                      className="text-sm font-semibold text-zinc-900"
                    >
                      {i.name}
                    </div>
                    <div
                      data-testid={`cart-item-price-${i.product_id}`}
                      className="text-sm text-zinc-500"
                    >
                      ${i.price.toFixed(2)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(i.product_id, i.quantity - 1)}
                      data-testid={`cart-decrement-${i.product_id}`}
                      className="h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      −
                    </button>
                    <span
                      data-testid={`cart-item-qty-${i.product_id}`}
                      className="w-6 text-center text-sm font-medium"
                    >
                      {i.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(i.product_id, i.quantity + 1)}
                      data-testid={`cart-increment-${i.product_id}`}
                      className="h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      +
                    </button>
                  </div>
                  <div
                    data-testid={`cart-item-subtotal-${i.product_id}`}
                    className="w-20 text-right text-sm font-semibold text-zinc-900"
                  >
                    ${(i.price * i.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => remove(i.product_id)}
                    data-testid={`cart-remove-${i.product_id}`}
                    className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <aside
              data-testid="cart-summary"
              className="col-span-1 h-fit rounded-xl border border-zinc-200 bg-white p-5"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Summary
              </h2>
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
                <span>Items</span>
                <span data-testid="summary-item-count">
                  {items.reduce((a, i) => a + i.quantity, 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold text-zinc-900">
                <span>Total</span>
                <span data-testid="cart-total">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                data-testid="checkout-button"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Checkout
              </button>
              <Link
                to="/products"
                data-testid="back-to-products"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
