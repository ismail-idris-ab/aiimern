import { ArrowRight, Download, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function HeroSection() {
  return (
    <section className="relative section-pad pt-32 md:pt-40 overflow-hidden">
      <div className="container-cf grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 fade-up">
          <span className="chip">
            <Sparkles size={12} /> Available for new projects
          </span>
          <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.05]">
            Crafting <span className="gradient-text">premium</span> digital
            experiences with intent.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            I'm Alex Carter — a senior product engineer designing and building
            interfaces, products, and brand systems for ambitious teams across
            the globe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/projects" className="btn-gold">
              View My Work <ArrowRight size={16} />
            </Link>
            <a href="#" className="btn-ghost">
              <Download size={16} /> Download CV
            </a>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            {[
              { k: "8+", v: "Years" },
              { k: "120+", v: "Projects" },
              { k: "40+", v: "Clients" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-3xl font-display font-semibold gold-text">{s.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 relative fade-up">
          <div className="relative aspect-[4/5] max-w-md mx-auto">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/30 via-transparent to-primary/10 blur-2xl" aria-hidden />
            <div className="relative h-full rounded-[2rem] overflow-hidden border border-[var(--border)] bg-surface">
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=900&q=80"
                alt="Portrait of Alex Carter, senior product engineer"
                className="h-full w-full object-cover opacity-95"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 p-4 rounded-2xl bg-background/70 backdrop-blur-xl border border-[var(--border)]">
                <span className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                <p className="text-sm">Currently building <span className="gold-text font-medium">Studio OS</span></p>
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
