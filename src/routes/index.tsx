import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { HeroSection } from "@/components/site/HeroSection";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/components/site/ProjectsGrid";

// Below-fold sections lazy-loaded — not needed for first paint
const AboutSection = lazy(() =>
  import("@/components/site/AboutSection").then((m) => ({ default: m.AboutSection })),
);
const SkillsSection = lazy(() =>
  import("@/components/site/SkillsSection").then((m) => ({ default: m.SkillsSection })),
);
const ServicesSection = lazy(() =>
  import("@/components/site/ServicesSection").then((m) => ({ default: m.ServicesSection })),
);
const StatsSection = lazy(() =>
  import("@/components/site/StatsSection").then((m) => ({ default: m.StatsSection })),
);
const ExperienceTimeline = lazy(() =>
  import("@/components/site/ExperienceTimeline").then((m) => ({ default: m.ExperienceTimeline })),
);
const ProjectsGrid = lazy(() =>
  import("@/components/site/ProjectsGrid").then((m) => ({ default: m.ProjectsGrid })),
);
const TestimonialsSection = lazy(() =>
  import("@/components/site/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection })),
);
const LatestBlogsSection = lazy(() =>
  import("@/components/site/LatestBlogsSection").then((m) => ({ default: m.LatestBlogsSection })),
);
const ContactSection = lazy(() =>
  import("@/components/site/ContactSection").then((m) => ({ default: m.ContactSection })),
);

export const Route = createFileRoute("/")({
  loader: async () => {
    const { data } = await supabase
      .from("projects")
      .select(
        "title, slug, excerpt, category, tags, cover_image, live_url, github_url, featured, sort_order",
      )
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .limit(6);
    return { projects: (data ?? []) as Project[] };
  },
  component: HomePage,
  head: () => {
    const title = "Aiiman Ismail — Full-Stack Developer & Product Builder";
    const description =
      "I build scalable web applications and digital products — specializing in the MERN stack for modern African markets.";
    const image = "/og-default.jpg";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: "AiimanFolio.Pro — Premium Portfolio & Blog" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: "/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Aiiman",
            jobTitle: "Senior Product Engineer",
            url: "/",
            sameAs: [],
            worksFor: { "@type": "Organization", name: "AiimanFolio.Pro" },
          }),
        },
      ],
    };
  },
});

function HomePage() {
  const { projects } = Route.useLoaderData();
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Suspense fallback={null}>
          <AboutSection />
          <SkillsSection />
          <ServicesSection />
          <StatsSection />
          <ExperienceTimeline />
          <ProjectsGrid limit={6} showFilters={false} initialProjects={projects} />
          <TestimonialsSection />
          <LatestBlogsSection />
          <ContactSection />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
