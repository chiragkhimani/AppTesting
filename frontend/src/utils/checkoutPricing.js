/** Demo checkout pricing helpers (client-side only). */

export const TAX_RATE = 0.08;
export const SHIPPING_FLAT = 5.99;
export const FREE_SHIPPING_MIN = 100;

/** Stripe-style test Visa — safe dummy for QA demos. */
export const DUMMY_CARD = {
  name: "Test User",
  number: "4242 4242 4242 4242",
  exp: "12/30",
  cvv: "123",
};

export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
}

export function calcTax(subtotal) {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function calcTotals(subtotal) {
  const shipping = calcShipping(subtotal);
  const tax = calcTax(subtotal);
  const grandTotal = Math.round((subtotal + shipping + tax) * 100) / 100;
  return { subtotal, shipping, tax, grandTotal };
}

export function formatCardNumber(value) {
  const digits = String(value).replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value) {
  const digits = String(value).replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidCardNumber(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 16;
}

export function isValidExpiry(value) {
  const m = String(value).match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  return month >= 1 && month <= 12;
}

export function isValidCvv(value) {
  return /^\d{3,4}$/.test(String(value).trim());
}

export const CHECKOUT_DRAFT_KEY = "qa_demo_checkout_draft";

export function saveCheckoutDraft(draft) {
  try {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
  } catch (_) {}
}

export function loadCheckoutDraft() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearCheckoutDraft() {
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch (_) {}
}
