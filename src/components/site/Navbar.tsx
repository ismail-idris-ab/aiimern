import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[color-mix(in_oklab,var(--background)_80%,transparent)] border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <nav className="container-cf flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            AiimanFolio<span className="gold-text">.Pro</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
              activeProps={{ className: "px-4 py-2 text-sm rounded-full text-primary bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link to="/contact" className="hidden md:inline-flex btn-gold !py-2.5 !px-5 !text-sm">
          Hire Me
        </Link>

        <button
          aria-label="Toggle menu"
          className="md:hidden grid place-items-center size-10 rounded-xl border border-[var(--border)]"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-background/95 backdrop-blur-xl">
          <div className="container-cf py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-foreground hover:bg-surface"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)} className="btn-gold mt-2">
              Hire Me
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
