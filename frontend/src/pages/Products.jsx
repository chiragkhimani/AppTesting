import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    api
      .products()
      .then((data) => {
        if (!active) return;
        setProducts(data.products || []);
      })
      .catch((e) => {
        if (!active) return;
        setError(
          e?.response?.data?.detail || "Failed to load products"
        );
      })
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
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1
              data-testid="page-title"
              className="text-3xl font-semibold tracking-tight text-zinc-900"
            >
              Products
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {loading ? "Loading…" : `${sorted.length} items available`}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Sort by
            <select
              data-testid="product-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
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
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md"
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
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link
                    to={`/products/${p.id}`}
                    data-testid={`product-name-${p.id}`}
                    className="text-base font-semibold text-zinc-900 hover:text-emerald-700"
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
                      <button
                        onClick={() => remove(p.id)}
                        data-testid={`remove-from-cart-${p.id}`}
                        className="inline-flex h-9 items-center rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => add(p)}
                        data-testid={`add-to-cart-${p.id}`}
                        className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
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
      </main>
    </div>
  );
};

export default Products;
