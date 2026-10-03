import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ReviewOrder from "./pages/ReviewOrder";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import TestPage from "./pages/TestPage";

const RequireAuth = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const routerBasename =
  process.env.REACT_APP_ROUTER_BASENAME !== undefined
    ? process.env.REACT_APP_ROUTER_BASENAME
    : "/playground";

function App() {
  return (
    <div className="App flex min-h-screen flex-col">
      <BrowserRouter basename={routerBasename}>
        <AuthProvider>
          <CartProvider>
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                <Route path="/products/:id" element={<RequireAuth><ProductDetails /></RequireAuth>} />
                <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                <Route path="/checkout/review" element={<RequireAuth><ReviewOrder /></RequireAuth>} />
                <Route path="/order-confirmation/:id" element={<RequireAuth><OrderConfirmation /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                <Route path="/test" element={<RequireAuth><TestPage /></RequireAuth>} />
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="*" element={<Navigate to="/products" replace />} />
              </Routes>
            </div>
            <Footer />
            <Toaster position="top-right" richColors />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
