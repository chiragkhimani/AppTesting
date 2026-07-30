import { Linkedin, Mail, Youtube } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/chiragkhimani",
    testId: "footer-linkedin",
    icon: Linkedin,
    label: "LinkedIn",
    className:
      "border-[#0A66C2]/25 bg-[#0A66C2]/10 text-[#0A66C2] hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(10,102,194,0.65)]",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/c/chiragkhimani",
    testId: "footer-youtube",
    icon: Youtube,
    label: "YouTube",
    className:
      "border-[#FF0000]/25 bg-[#FF0000]/10 text-[#FF0000] hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(255,0,0,0.55)]",
  },
];

const Footer = () => (
  <footer
    data-testid="app-footer"
    className="mt-auto border-t border-zinc-200/80 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_55%,#f8fafc_100%)]"
  >
    <div className="mx-auto max-w-6xl px-4 py-7">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-5 shadow-sm shadow-zinc-200/40 backdrop-blur-sm lg:flex-row lg:justify-between lg:gap-4">
        <div className="text-center lg:text-left">
          <p className="text-sm font-semibold tracking-tight text-zinc-800">
            QA Demo Store
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Built for hands-on QA practice
          </p>
        </div>

        <div
          data-testid="feature-request-message"
          className="flex max-w-xl flex-col items-center gap-2 text-center"
        >
          <p className="text-sm text-zinc-600">
            Have a feature idea or improvement suggestion?
          </p>
          <a
            href="mailto:contact@chiragkhimani.com?subject=QA%20Demo%20Store%20Feature%20Request"
            data-testid="feature-request-email"
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-800 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md hover:shadow-emerald-100"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white transition group-hover:scale-105">
              <Mail className="h-3.5 w-3.5" />
            </span>
            contact@chiragkhimani.com
          </a>
        </div>

        <div
          data-testid="footer-social"
          className="flex flex-col items-center gap-2.5"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Connect with me
          </span>
          <div className="flex items-center gap-2.5">
            {socialLinks.map(({ name, href, testId, icon: Icon, label, className }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={testId}
                aria-label={label}
                title={label}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 ${className}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
