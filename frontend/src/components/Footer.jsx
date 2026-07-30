import { Linkedin, Mail, Youtube } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/chiragkhimani",
    testId: "footer-linkedin",
    icon: Linkedin,
    label: "LinkedIn",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/c/chiragkhimani",
    testId: "footer-youtube",
    icon: Youtube,
    label: "YouTube",
  },
];

const Footer = () => (
  <footer
    data-testid="app-footer"
    className="mt-auto border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
  >
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
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

      <div
        data-testid="footer-social"
        className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Connect with me
        </span>
        <div className="flex items-center gap-2">
          {socialLinks.map(({ name, href, testId, icon: Icon, label }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={testId}
              aria-label={label}
              title={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
