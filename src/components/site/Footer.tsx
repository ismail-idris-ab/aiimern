import { Link } from "@tanstack/react-router";
import { Github, Twitter, Mail, Sparkles, Linkedin, Facebook, ArrowUpRight } from "lucide-react";

const SOCIAL = [
  { Icon: Github,   label: "GitHub",   href: "https://github.com/ismail-idris-ab" },
  { Icon: Twitter,  label: "Twitter",  href: "https://x.com/ismail_idris_ab" },
  { Icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { Icon: Facebook, label: "Facebook", href: "https://facebook.com/ismailidris.abdullahi.5" },
  { Icon: Mail,     label: "Email",    href: "mailto:ismailidris2222@yahoo.com" },
];

const NAV = [
  { to: "/",        label: "Home" },
  { to: "/projects",label: "Projects" },
  { to: "/blog",    label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">

      {/* CTA band */}
      <div className="container-cf py-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Open to opportunities
          </p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.05]">
            Let's build<br />
            <span className="gradient-text">something real.</span>
          </h2>
        </div>
        <Link
          to="/contact"
          className="btn-gold shrink-0 group inline-flex items-center gap-2"
        >
          Start a conversation
          <ArrowUpRight
            size={16}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* Main grid */}
      <div className="container-cf py-14 grid gap-12 md:grid-cols-[2fr_1fr_1fr]">

        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 w-fit">
            <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold">
              AiimanFolio<span className="gold-text">.Pro</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Senior product engineer crafting robust systems and refined digital
            experiences for teams that ship with intention.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SOCIAL.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className="grid place-items-center size-9 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Navigate */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
            Navigate
          </h4>
          <ul className="space-y-3">
            {NAV.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-5">
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="mailto:ismailidris2222@yahoo.com"
                className="text-foreground/70 hover:text-primary transition-colors"
              >
                ismailidris2222@yahoo.com
              </a>
            </li>
            <li className="text-muted-foreground">Remote · Nigeria</li>
            <li>
              <span className="inline-flex items-center gap-1.5 text-primary text-xs">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Available for projects
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="container-cf py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Ismail Idris. All rights reserved.</p>
          <p>Designed &amp; engineered by Ismail Idris.</p>
        </div>
      </div>

    </footer>
  );
}
