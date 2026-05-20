import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { parseMarkdown } from "@/lib/markdown";
import { optimizeImage, imageSrcSet } from "@/lib/image";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects_/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw redirect({ to: "/projects" });

    const html = data.content ? (await parseMarkdown(data.content)).html : "";
    return { project: data, html };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.project;
    if (!p) return {};
    const title = `${p.title} — AiimanFolio.Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: p.excerpt ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: p.excerpt ?? "" },
        { property: "og:image", content: p.cover_image ?? "/og-default.jpg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: p.excerpt ?? "" },
        { name: "twitter:image", content: p.cover_image ?? "/og-default.jpg" },
      ],
      links: [{ rel: "canonical", href: `/projects/${p.slug}` }],
    };
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { project: p, html } = Route.useLoaderData();

  return (
    <>
      <Navbar />
      <main>
        <div className="container-cf max-w-4xl pt-32 pb-20">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            All projects
          </Link>

          <div className="mt-8">
            <span className="chip">{p.category}</span>
            <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
              {p.title}
            </h1>

            {p.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{p.excerpt}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t: string) => (
                    <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {(p.live_url || p.github_url) && (
                <div className="flex gap-3 flex-wrap ml-auto">
                  {p.live_url && (
                    <a
                      href={p.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold inline-flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      Live site
                    </a>
                  )}
                  {p.github_url && (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost inline-flex items-center gap-2"
                    >
                      <Github size={14} />
                      Source
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {p.cover_image && (
            <div className="mt-10 rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/40 relative">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/6 pointer-events-none z-10" />
              <img
                src={optimizeImage(p.cover_image, 1200)}
                srcSet={imageSrcSet(p.cover_image, [600, 900, 1200])}
                sizes="(max-width: 896px) 100vw, 896px"
                alt={p.title}
                className="w-full aspect-[16/9] object-cover"
                fetchpriority="high"
              />
            </div>
          )}

          {html && (
            <div className="prose-cf mt-12" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
