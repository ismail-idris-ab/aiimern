import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Calendar, Clock, ArrowRight, Inbox } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog")({
  component: BlogIndex,
  head: () => {
    const title = "Blog — CraftFolio Pro";
    const description = "Essays on design, engineering, and shipping premium products. Tutorials, notes, and case studies from the craft of building software.";
    const image = "/og-default.jpg";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/blog" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: "CraftFolio Pro — Essays on craft, design & engineering" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: "/blog" }],
    };
  },
});

const PAGE_SIZE = 6;

function BlogIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [tag, setTag] = useState<string>("All");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("title, slug, excerpt, cover_image, category, tags, reading_time, published_at, featured, author_name")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => ["All", ...Array.from(new Set((data ?? []).map((p) => p.category)))], [data]);
  const tags = useMemo(() => ["All", ...Array.from(new Set((data ?? []).flatMap((p) => p.tags ?? [])))], [data]);

  const featured = useMemo(() => data?.find((p) => p.featured), [data]);

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (p.featured) return false;
      if (category !== "All" && p.category !== category) return false;
      if (tag !== "All" && !(p.tags ?? []).includes(tag)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.excerpt.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, category, tag, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-12">
          <div className="container-cf max-w-3xl text-center">
            <span className="chip">The Blog</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-display font-semibold leading-tight">
              Ideas worth <span className="gradient-text">writing down</span>.
            </h1>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Essays, notes, and tutorials on design, engineering, and the craft of shipping.
            </p>
          </div>
        </section>

        <section className="container-cf">
          <div className="card-cf p-4 md:p-5 grid md:grid-cols-[1fr_auto_auto] gap-3 md:items-center">
            <label className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search articles…"
                className="w-full bg-surface-soft border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="bg-surface-soft border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary">
              {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
            </select>
            <select value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }} className="bg-surface-soft border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary">
              {tags.map((t) => <option key={t} value={t}>{t === "All" ? "All tags" : `#${t}`}</option>)}
            </select>
          </div>
        </section>

        <section className="container-cf mt-12">
          {isLoading && <div className="text-center text-muted-foreground py-20">Loading articles…</div>}
          {error && <div className="text-center text-destructive py-20">Failed to load articles. Please try again.</div>}

          {!isLoading && !error && (
            <>
              {featured && category === "All" && tag === "All" && !query && (
                <Link to="/blog/$slug" params={{ slug: featured.slug }} className="card-cf grid md:grid-cols-2 overflow-hidden mb-12 group">
                  <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                    <img src={featured.cover_image || "/og-default.jpg"} alt={featured.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <span className="chip self-start">Featured · {featured.category}</span>
                    <h2 className="mt-4 text-3xl md:text-4xl font-display font-semibold leading-tight group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                    <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{featured.published_at && new Date(featured.published_at).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock size={12} />{featured.reading_time} min read</span>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-primary font-medium">Read article <ArrowRight size={14} /></span>
                  </div>
                </Link>
              )}

              {pageItems.length === 0 ? (
                <div className="text-center py-20">
                  <Inbox className="mx-auto text-muted-foreground mb-4" size={32} />
                  <p className="text-muted-foreground">No articles match your filters.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pageItems.map((post) => (
                    <Link key={post.slug} to="/blog/$slug" params={{ slug: post.slug }} className="card-cf p-4 group">
                      <div className="aspect-[16/10] rounded-xl overflow-hidden">
                        <img src={post.cover_image || "/og-default.jpg"} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="chip !py-1 !px-2.5 !text-[11px]">{post.category}</span>
                          <span className="inline-flex items-center gap-1"><Clock size={12} />{post.reading_time} min</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {pageCount > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`size-10 rounded-full text-sm font-medium border transition-colors ${
                        page === i + 1
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-[var(--border)] text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
