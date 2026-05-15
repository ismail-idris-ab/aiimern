import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function LatestBlogsSection() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["latest-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("title, slug, excerpt, cover_image, category, reading_time, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="section-pad">
      <div className="container-cf">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="chip">Latest writing</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
              From the <span className="gradient-text">blog</span>.
            </h2>
          </div>
          <Link to="/blog" className="btn-ghost">All articles</Link>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-cf p-6 animate-pulse">
                <div className="aspect-[16/10] bg-surface-soft rounded-xl" />
                <div className="h-4 mt-4 bg-surface-soft rounded w-3/4" />
                <div className="h-3 mt-2 bg-surface-soft rounded w-full" />
              </div>
            ))}

          {posts?.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="card-cf p-4 group"
            >
              <div className="aspect-[16/10] rounded-xl overflow-hidden">
                <img src={post.cover_image ?? ""} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="chip !py-1 !px-2.5 !text-[11px]">{post.category}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} />{post.reading_time} min</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                  <ArrowUpRight size={14} className="text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
