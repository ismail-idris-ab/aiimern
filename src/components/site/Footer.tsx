import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Mail, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24">
      <div className="container-cf py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold">
              CraftFolio<span className="gold-text">.Pro</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            A premium portfolio &amp; blog platform crafted for developers and designers
            who care about every detail.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/projects" className="hover:text-primary">Projects</Link></li>
            <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Connect</h4>
          <div className="flex gap-3">
            {[
              { Icon: Github, label: "GitHub" },
              { Icon: Twitter, label: "Twitter" },
              { Icon: Linkedin, label: "LinkedIn" },
              { Icon: Mail, label: "Email" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="container-cf py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CraftFolio Pro. Crafted with care.</p>
          <p>Built on TanStack Start &amp; Lovable Cloud.</p>
        </div>
      </div>
    </footer>
  );
}
