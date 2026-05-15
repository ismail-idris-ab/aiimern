import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export type Project = {
  title: string;
  category: string;
  tags: string[];
  image: string;
  link?: string;
};

export const PROJECTS: Project[] = [
  { title: "Aurora Banking", category: "Product", tags: ["Web App", "Fintech"], image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80" },
  { title: "Helio Storefront", category: "E-commerce", tags: ["Shopify", "Branding"], image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80" },
  { title: "Studio OS", category: "SaaS", tags: ["Dashboard", "Design System"], image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80" },
  { title: "Northwind Site", category: "Marketing", tags: ["Landing", "Motion"], image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80" },
  { title: "Lumen Mobile", category: "Mobile", tags: ["iOS", "App"], image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80" },
  { title: "Forge Brand System", category: "Branding", tags: ["Identity", "Guidelines"], image: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&q=80" },
];

const FILTERS = ["All", "Product", "E-commerce", "SaaS", "Marketing", "Mobile", "Branding"] as const;

export function ProjectsGrid({ limit, showFilters = true }: { limit?: number; showFilters?: boolean }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    const base = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);
    return limit ? base.slice(0, limit) : base;
  }, [filter, limit]);

  return (
    <section className="section-pad" id="projects">
      <div className="container-cf">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="chip">Selected work</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
              Projects I'm <span className="gradient-text">proud of</span>.
            </h2>
          </div>
          {!limit && (
            <Link to="/projects" className="hidden md:inline-flex btn-ghost">View all</Link>
          )}
        </div>

        {showFilters && (
          <div className="mt-8 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article key={p.title} className="card-cf overflow-hidden group">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary mb-1">{p.category}</div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                  </div>
                  <span className="grid place-items-center size-10 rounded-full border border-[var(--border)] text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-surface-soft text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {limit && (
          <div className="mt-10 text-center">
            <Link to="/projects" className="btn-ghost">Browse all projects</Link>
          </div>
        )}
      </div>
    </section>
  );
}
