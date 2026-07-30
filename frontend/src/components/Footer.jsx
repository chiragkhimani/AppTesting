import { Mail } from "lucide-react";

const Footer = () => (
  <footer
    data-testid="app-footer"
    className="mt-auto border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
  >
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:gap-4">
      <p className="text-xs font-medium tracking-wide text-zinc-400">
        QA Demo Store
      </p>

      <div
        data-testid="feature-request-message"
        className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2"
      >
        <span className="text-sm text-zinc-600">
          Have a feature idea or improvement suggestion?
        </span>
        <a
          href="mailto:contact@chiragkhimani.com?subject=QA%20Demo%20Store%20Feature%20Request"
          data-testid="feature-request-email"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          <Mail className="h-3.5 w-3.5" />
          contact@chiragkhimani.com
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
