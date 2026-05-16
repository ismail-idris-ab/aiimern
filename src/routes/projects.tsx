import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  head: () => {
    const title = "Projects — AiimanFolio.Pro";
    const description = "A curated selection of product, web app, and brand work — case studies spanning design systems, full-stack engineering, and launch strategy.";
    const image = "/og-default.jpg";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/projects" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: "AiimanFolio.Pro — Selected Projects" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: "/projects" }],
    };
  },
});

function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-4">
          <div className="container-cf max-w-3xl text-center">
            <span className="chip">Portfolio</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-display font-semibold leading-tight">
              Selected <span className="gradient-text">projects</span>.
            </h1>
            <p className="mt-5 text-muted-foreground text-lg">A curated look at the work I'm most proud of, across products, brands, and platforms.</p>
          </div>
        </section>
        <ProjectsGrid />
      </main>
      <Footer />
    </>
  );
}
