import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Clock, ArrowLeft, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BlogReadingProgress } from "@/components/site/BlogReadingProgress";
import { BlogTOC } from "@/components/site/BlogTOC";
import { BlogNewsletterCard } from "@/components/site/BlogNewsletterCard";
import { parseMarkdown } from "@/lib/markdown";
import type { TocItem } from "@/lib/markdown";
import { optimizeImage, imageSrcSet } from "@/lib/image";
import { supabase } from "@/integrations/supabase/client";

function splitContent(content: string): [string, string] {
  if (content.length < 300) return [content, ""];
  const mid = Math.floor(content.length / 2);
  const splitIdx = content.indexOf("\n\n", mid);
  if (splitIdx === -1) return [content, ""];
  return [content.slice(0, splitIdx), content.slice(splitIdx + 2)];
}

export const Route = createFileRoute("/blog_/$slug")({
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

    const [first, second] = splitContent(data.content || "");
    const [a, b] = await Promise.all([
      parseMarkdown(first),
      second ? parseMarkdown(second) : Promise.resolve({ html: "", toc: [] as TocItem[] }),
    ]);

    return {
      post: data,
      related: related ?? [],
      firstHtml: a.html,
      secondHtml: b.html,
      toc: [...a.toc, ...b.toc],
    };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const title = post?.seo_title || post?.title || "Article";
    const desc = (
      post?.seo_description ||
      post?.excerpt ||
      "Read the latest essay on design, engineering, and shipping premium products."
    ).slice(0, 200);
    const image = post?.cover_image || "/og-default.jpg";
    const url = `/blog/${params.slug}`;
    return {
      meta: [
        { title: `${title} — AiimanFolio.Pro` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: title },
        ...(post?.published_at
          ? [{ property: "article:published_time", content: post.published_at }]
          : []),
        ...(post?.author_name ? [{ property: "article:author", content: post.author_name }] : []),
        ...(post?.category ? [{ property: "article:section", content: post.category }] : []),
        ...(post?.tags ?? []).map((tag: string) => ({
          property: "article:tag",
          content: tag,
        })),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: post.title,
                description: post.excerpt,
                image: image,
                datePublished: post.published_at,
                dateModified: post.published_at,
                author: { "@type": "Person", name: post.author_name },
                mainEntityOfPage: { "@type": "WebPage", "@id": url },
              }),
            },
          ]
        : [],
    };
  },
  component: BlogPost,
  errorComponent: ({ error }) => (
    <>
      <Navbar />
      <div className="container-cf pt-36 pb-20 text-center">
        <h1 className="text-3xl font-display font-semibold">Couldn't load article</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Link to="/blog" className="btn-ghost mt-6 inline-flex">
          Back to blog
        </Link>
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
        <Link to="/blog" className="btn-gold mt-6 inline-flex">
          Back to blog
        </Link>
      </div>
      <Footer />
    </>
  ),
});

function BlogPost() {
  const { post, related, firstHtml, secondHtml, toc } = Route.useLoaderData();

  const postUrl = `https://aiimanfolio.pro/blog/${post.slug}`;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post.title);

  return (
    <>
      <Navbar />
      <BlogReadingProgress />
      <main>
        <article className="pt-32">
          <div className="container-cf max-w-3xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={14} /> All articles
            </Link>

            <header className="mt-8 text-center max-w-3xl mx-auto">
              <Link to="/blog/category/$slug" params={{ slug: post.category }} className="chip">
                {post.category}
              </Link>
              <h1 className="mt-5 text-4xl md:text-6xl font-display font-semibold leading-[1.1]">
                {post.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
              <div className="mt-6 flex items-center justify-center gap-5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{post.author_name}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  {post.published_at &&
                    new Date(post.published_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.reading_time} min read
                </span>
              </div>
            </header>

            <div className="mt-12 aspect-[16/9] rounded-3xl overflow-hidden border border-[var(--border)]">
              <img
                src={optimizeImage(post.cover_image, 1200)}
                srcSet={imageSrcSet(post.cover_image, [600, 900, 1200])}
                sizes="(max-width: 768px) 100vw, 768px"
                alt={post.title}
                className="h-full w-full object-cover"
                fetchpriority="high"
              />
            </div>
          </div>

          <div className="container-cf mt-14">
            <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10 max-w-4xl mx-auto">
              <div>
                <div className="prose-cf" dangerouslySetInnerHTML={{ __html: firstHtml }} />
                <BlogNewsletterCard />
                <div className="prose-cf" dangerouslySetInnerHTML={{ __html: secondHtml }} />
              </div>
              <aside className="hidden lg:block">
                <BlogTOC toc={toc} />
              </aside>
            </div>
          </div>

          <div className="container-cf">
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 max-w-4xl mx-auto flex flex-wrap gap-2">
                {post.tags.map((t: string) => (
                  <Link
                    key={t}
                    to="/blog/tag/$slug"
                    params={{ slug: t }}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground hover:text-primary transition-colors"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 max-w-4xl mx-auto pt-8 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Share this article</span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
                      "_blank",
                    )
                  }
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Twitter size={15} />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                      "_blank",
                    )
                  }
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Linkedin size={15} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(postUrl);
                    toast("Link copied!");
                  }}
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <LinkIcon size={15} />
                </button>
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section-pad">
            <div className="container-cf">
              <h2 className="text-3xl font-display font-semibold mb-8">Related articles</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map(
                  (r: {
                    slug: string;
                    title: string;
                    cover_image: string | null;
                    category: string;
                    reading_time: number;
                  }) => (
                    <Link
                      key={r.slug}
                      to="/blog/$slug"
                      params={{ slug: r.slug }}
                      className="card-cf p-4 group"
                    >
                      <div className="aspect-[16/10] rounded-xl overflow-hidden">
                        <img
                          src={optimizeImage(r.cover_image, 600)}
                          srcSet={imageSrcSet(r.cover_image, [400, 600, 800])}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          alt={r.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <span className="chip !py-1 !px-2.5 !text-[11px]">{r.category}</span>
                        <h3 className="mt-3 font-semibold group-hover:text-primary transition-colors">
                          {r.title}
                        </h3>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
