import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { add, remove, has } = useCart();

  useEffect(() => {
    let active = true;
    api
      .product(id)
      .then((data) => active && setProduct(data.product))
      .catch((e) =>
        active &&
        setError(e?.response?.data?.detail || "Product not found")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          data-testid="back-button"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {loading && (
          <div data-testid="product-loading" className="text-sm text-zinc-500">
            Loading…
          </div>
        )}

        {error && (
          <div
            data-testid="product-error"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}{" "}
            <Link to="/products" className="underline">
              Back to products
            </Link>
          </div>
        )}

        {product && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div
              data-testid="product-detail-image"
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p
                data-testid="product-detail-category"
                className="text-xs font-semibold uppercase tracking-wider text-emerald-700"
              >
                {product.category}
              </p>
              <h1
                data-testid="product-detail-name"
                className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900"
              >
                {product.name}
              </h1>
              <p
                data-testid="product-detail-price"
                className="mt-4 text-2xl font-semibold text-zinc-900"
              >
                ${product.price.toFixed(2)}
              </p>
              <p
                data-testid="product-detail-description"
                className="mt-4 text-base leading-relaxed text-zinc-600"
              >
                {product.description}
              </p>
              <p
                data-testid="product-detail-stock"
                className="mt-3 text-sm text-zinc-500"
              >
                In stock: {product.stock}
              </p>

              <div className="mt-6">
                {has(product.id) ? (
                  <button
                    onClick={() => remove(product.id)}
                    data-testid="detail-remove-from-cart"
                    className="inline-flex h-11 items-center rounded-md border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove from cart
                  </button>
                ) : (
                  <button
                    onClick={() => add(product)}
                    data-testid="detail-add-to-cart"
                    className="inline-flex h-11 items-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetails;
