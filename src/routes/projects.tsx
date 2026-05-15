import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — CraftFolio Pro" },
      { name: "description", content: "A selection of work spanning product design, web apps, and brand systems." },
      { property: "og:title", content: "Projects — CraftFolio Pro" },
      { property: "og:description", content: "A selection of work spanning product design, web apps, and brand systems." },
      { property: "og:url", content: "/projects" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
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
