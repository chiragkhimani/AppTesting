import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShoppingBag } from "lucide-react";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("az");
  const { add, remove, has } = useCart();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .products()
      .then((data) => active && setProducts(data.products || []))
      .catch((e) =>
        active &&
        setError(e?.response?.data?.detail || "Failed to load products"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const arr = [...products];
    switch (sort) {
      case "za":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "lohi":
        arr.sort((a, b) => a.price - b.price);
        break;
      case "hilo":
        arr.sort((a, b) => b.price - a.price);
        break;
      default:
        arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [products, sort]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              data-testid="page-title"
              className="text-3xl font-semibold tracking-tight text-zinc-900"
            >
              Products
            </h1>
            <p
              data-testid="products-subtitle"
              className="mt-1 flex items-center gap-2 text-sm text-zinc-500"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading
                  products…
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" /> {sorted.length} items
                  available
                </>
              )}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Sort by
            <select
              data-testid="product-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
            >
              <option value="az">Name (A → Z)</option>
              <option value="za">Name (Z → A)</option>
              <option value="lohi">Price (low → high)</option>
              <option value="hilo">Price (high → low)</option>
            </select>
          </label>
        </div>

        {error && (
          <div
            data-testid="products-error"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading && !error && (
          <div
            data-testid="products-loading"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
              >
                <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div
            data-testid="product-list"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sorted.map((p) => {
              const inCart = has(p.id);
              return (
                <article
                  key={p.id}
                  data-testid={`product-card-${p.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/40"
                >
                  <Link
                    to={`/products/${p.id}`}
                    data-testid={`product-image-link-${p.id}`}
                    className="block aspect-[4/3] overflow-hidden bg-zinc-100"
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <Link
                      to={`/products/${p.id}`}
                      data-testid={`product-name-${p.id}`}
                      className="text-base font-semibold text-zinc-900 transition hover:text-emerald-700"
                    >
                      {p.name}
                    </Link>
                    <p
                      data-testid={`product-description-${p.id}`}
                      className="mt-1 line-clamp-2 text-sm text-zinc-500"
                    >
                      {p.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        data-testid={`product-price-${p.id}`}
                        className="text-lg font-semibold text-zinc-900"
                      >
                        ${p.price.toFixed(2)}
                      </span>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => add(p)}
                            data-testid={`add-to-cart-${p.id}`}
                            className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                          >
                            Add more
                          </button>
                          <button
                            onClick={() => remove(p.id)}
                            data-testid={`remove-from-cart-${p.id}`}
                            className="inline-flex h-9 items-center rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 active:scale-[0.98]"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => add(p)}
                          data-testid={`add-to-cart-${p.id}`}
                          className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                        >
                          Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
