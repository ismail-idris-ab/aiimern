import {
  ArrowRight,
  Download,
  Sparkles,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import portrait from "@/assets/portrait.jpg";

export function HeroSection() {
  return (
    <section className="relative section-pad pt-32 md:pt-40 overflow-hidden">
      <div className="container-cf px-6 md:px-12 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 fade-up">
          <span className="chip">
            <Sparkles size={12} /> Available for new projects
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-[1.05]">
            I turn <span className="gradient-text">ideas</span><br />
            into full-stack products.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            I'm Ismail Idris — a fullstack developer building fast, scalable web applications with
            the MERN stack. From database to UI, I own the entire build.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/projects" className="btn-gold">
              View My Work <ArrowRight size={16} />
            </Link>
            <a href="/Ismail_Idris_CV (2).pdf" download className="btn-ghost">
              <Download size={16} /> Download CV
            </a>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {[
              { Icon: Github, label: "GitHub", href: "https://github.com/ismail-idris-ab" },
              { Icon: Twitter, label: "Twitter", href: "https://x.com/ismail_idris_ab" },
              { Icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
              {
                Icon: Facebook,
                label: "Facebook",
                href: "https://facebook.com/ismailidris.abdullahi.5",
              },
              { Icon: Mail, label: "Email", href: "mailto:ismailidris2222@yahoo.com" },
            ].map(({ Icon, label, href }) => (
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

          <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            {[
              { k: "4+", v: "Years" },
              { k: "12+", v: "Projects" },
              { k: "6+", v: "Clients" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-3xl font-display font-semibold gold-text">{s.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-[400px] lg:w-[480px] shrink-0 relative fade-up">
          <div className="relative aspect-[4/5] max-w-md mx-auto">
            <div
              className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/30 via-transparent to-primary/10 blur-2xl"
              aria-hidden
            />
            <div className="relative h-full rounded-[2rem] overflow-hidden border border-[var(--border)] bg-surface">
              <img
                src={portrait}
                alt="Portrait of Aiiman, senior product engineer"
                className="h-full w-full object-cover opacity-95"
                loading="eager"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 p-4 rounded-2xl bg-background/70 backdrop-blur-xl border border-[var(--border)]">
                <span className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                <p className="text-sm">
                  Currently building <span className="gold-text font-medium">Studio OS</span>
                </p>
              </div>
            </div>

            <div className="hidden md:flex absolute -left-10 top-10 items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--border)] bg-surface/90 backdrop-blur-xl">
              <span className="text-2xl">🏆</span>
              <div className="text-xs">
                <div className="font-medium">Awwwards</div>
                <div className="text-muted-foreground">Site of the Day</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-6 bottom-20 items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--border)] bg-surface/90 backdrop-blur-xl">
              <span className="text-2xl gold-text">★</span>
              <div className="text-xs">
                <div className="font-medium">5.0 Rating</div>
                <div className="text-muted-foreground">40+ Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
