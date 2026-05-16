import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Inbox } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/tag/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, cover_image, category, reading_time, published_at",
      )
      .eq("status", "published")
      .contains("tags", [params.slug])
      .order("published_at", { ascending: false });
    if (error) throw error;
    return { posts: data ?? [], slug: params.slug };
  },
  head: ({ params }) => ({
    meta: [
      { title: `#${params.slug} articles — AiimanFolio.Pro` },
      {
        name: "description",
        content: `All articles tagged with #${params.slug}.`,
      },
    ],
    links: [{ rel: "canonical", href: `/blog/tag/${params.slug}` }],
  }),
  component: TagArchive,
});

function TagArchive() {
  const { posts, slug } = Route.useLoaderData();

  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-12">
          <div className="container-cf max-w-3xl text-center">
            <span className="chip">Tag</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-display font-semibold leading-tight">
              <span className="gradient-text">#{slug}</span>
            </h1>
          </div>
        </section>

        <section className="container-cf pb-20">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <Inbox className="mx-auto text-muted-foreground mb-4" size={32} />
              <p className="text-muted-foreground">
                No articles with this tag yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="card-cf p-4 group"
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden">
                    <img
                      src={post.cover_image || "/og-default.jpg"}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="chip !py-1 !px-2.5 !text-[11px]">
                        {post.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {post.reading_time} min
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
