import { Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Project = {
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  cover_image: string | null;
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  sort_order: number;
};

export function ProjectsGrid({ limit, showFilters = true }: { limit?: number; showFilters?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("title, slug, excerpt, category, tags, cover_image, live_url, github_url, featured, sort_order")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        setProjects(data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );

  const filtered = useMemo(() => {
    const base = filter === "All" ? projects : projects.filter((p) => p.category === filter);
    return limit ? base.slice(0, limit) : base;
  }, [projects, filter, limit]);

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

        {showFilters && !loading && categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((f) => (
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
          {loading
            ? Array.from({ length: limit ?? 6 }).map((_, i) => (
                <div key={i} className="card-cf overflow-hidden">
                  <div className="aspect-[4/3] animate-pulse bg-surface-soft" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-16 rounded animate-pulse bg-surface-soft" />
                    <div className="h-4 w-3/4 rounded animate-pulse bg-surface-soft" />
                  </div>
                </div>
              ))
            : filtered.map((p) => (
                <Link
                  key={p.slug}
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="card-cf overflow-hidden group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {p.cover_image ? (
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-surface-soft" />
                    )}
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
                </Link>
              ))}
        </div>

        {limit && !loading && (
          <div className="mt-10 text-center">
            <Link to="/projects" className="btn-ghost">Browse all projects</Link>
          </div>
        )}
      </div>
    </section>
  );
}
