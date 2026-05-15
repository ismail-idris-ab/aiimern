import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Clock, ArrowLeft, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();

    const { data: related } = await supabase
      .from("blog_posts")
      .select("title, slug, cover_image, category, reading_time")
      .eq("status", "published")
      .neq("slug", params.slug)
      .limit(3);

    return { post: data, related: related ?? [] };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const title = post?.seo_title || post?.title || "Article";
    const desc = post?.seo_description || post?.excerpt || "";
    return {
      meta: [
        { title: `${title} — CraftFolio Pro` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `/blog/${params.slug}` },
        { property: "og:type", content: "article" },
        ...(post?.cover_image ? [{ property: "og:image", content: post.cover_image }] : []),
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: post ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image,
          datePublished: post.published_at,
          author: { "@type": "Person", name: post.author_name },
        }),
      }] : [],
    };
  },
  component: BlogPost,
  errorComponent: ({ error }) => (
    <>
      <Navbar />
      <div className="container-cf pt-36 pb-20 text-center">
        <h1 className="text-3xl font-display font-semibold">Couldn't load article</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Link to="/blog" className="btn-ghost mt-6 inline-flex">Back to blog</Link>
      </div>
      <Footer />
    </>
  ),
  notFoundComponent: () => (
    <>
      <Navbar />
      <div className="container-cf pt-36 pb-20 text-center">
        <h1 className="text-5xl font-display font-semibold gold-text">404</h1>
        <p className="text-muted-foreground mt-2">Article not found.</p>
        <Link to="/blog" className="btn-gold mt-6 inline-flex">Back to blog</Link>
      </div>
      <Footer />
    </>
  ),
});

function renderMarkdown(md: string) {
  // Minimal markdown rendering for headings and paragraphs.
  return md.split(/\n{2,}/).map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
    if (block.startsWith("### ")) return <h3 key={i}>{block.slice(4)}</h3>;
    return <p key={i}>{block}</p>;
  });
}

function BlogPost() {
  const { post, related } = Route.useLoaderData();

  return (
    <>
      <Navbar />
      <main>
        <article className="pt-32">
          <div className="container-cf max-w-4xl">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft size={14} /> All articles
            </Link>

            <header className="mt-8 text-center max-w-3xl mx-auto">
              <span className="chip">{post.category}</span>
              <h1 className="mt-5 text-4xl md:text-6xl font-display font-semibold leading-[1.1]">{post.title}</h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
              <div className="mt-6 flex items-center justify-center gap-5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{post.author_name}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{post.published_at && new Date(post.published_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} />{post.reading_time} min read</span>
              </div>
            </header>

            {post.cover_image && (
              <div className="mt-12 aspect-[16/9] rounded-3xl overflow-hidden border border-[var(--border)]">
                <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="mt-14 prose-cf max-w-3xl mx-auto">
              {renderMarkdown(post.content || "")}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 max-w-3xl mx-auto flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground">#{t}</span>
                ))}
              </div>
            )}

            <div className="mt-10 max-w-3xl mx-auto pt-8 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Share this article</span>
              <div className="flex gap-2">
                {[Twitter, Linkedin, LinkIcon].map((Icon, i) => (
                  <button key={i} className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section-pad">
            <div className="container-cf">
              <h2 className="text-3xl font-display font-semibold mb-8">Related articles</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((r) => (
                  <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="card-cf p-4 group">
                    <div className="aspect-[16/10] rounded-xl overflow-hidden">
                      <img src={r.cover_image ?? ""} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <span className="chip !py-1 !px-2.5 !text-[11px]">{r.category}</span>
                      <h3 className="mt-3 font-semibold group-hover:text-primary transition-colors">{r.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
