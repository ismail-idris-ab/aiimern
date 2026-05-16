import { useState, useEffect } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { parseMarkdown } from "@/lib/markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!data) throw redirect({ to: "/projects" });
    return { project: data };
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
  const { project: p } = Route.useLoaderData();
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (p.content) {
      parseMarkdown(p.content).then(({ html }) => setHtml(html));
    }
  }, [p.content]);

  return (
    <>
      <Navbar />
      <main>
        {p.cover_image && (
          <div className="w-full aspect-[21/9] overflow-hidden">
            <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container-cf max-w-4xl py-16">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            All projects
          </Link>

          <span className="chip">{p.category}</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
            {p.title}
          </h1>

          {p.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{p.excerpt}</p>
          )}

          {p.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t: string) => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {(p.live_url || p.github_url) && (
            <div className="mt-6 flex gap-3 flex-wrap">
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

          {html && (
            <div className="prose-cf mt-12" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
