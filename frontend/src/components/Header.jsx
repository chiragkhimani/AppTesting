import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, Package, Receipt, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to="/products"
          data-testid="app-logo"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900"
        >
          <Package className="h-5 w-5 text-emerald-600" />
          <span>QA Demo Store</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/products"
            data-testid="nav-products"
            className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
          >
            Products
          </Link>
          <Link
            to="/orders"
            data-testid="orders-link"
            className="hidden h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
          >
            <Receipt className="h-4 w-4" />
            Orders
          </Link>
          <Link
            to="/test"
            data-testid="test-page-link"
            className="hidden h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
          >
            <FlaskConical className="h-4 w-4" />
            Test Page
          </Link>

          <span
            data-testid="user-greeting"
            className="hidden text-sm text-zinc-600 md:block"
          >
            Hi, <span className="font-medium text-zinc-900">{user.first_name || user.username}</span>
          </span>

          <Link
            to="/cart"
            data-testid="cart-link"
            className="relative inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span
                data-testid="cart-badge"
                className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white"
              >
                {count}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
