import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { HeroSection } from "@/components/site/HeroSection";
import { AboutSection } from "@/components/site/AboutSection";
import { SkillsSection } from "@/components/site/SkillsSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { StatsSection } from "@/components/site/StatsSection";
import { ExperienceTimeline } from "@/components/site/ExperienceTimeline";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { LatestBlogsSection } from "@/components/site/LatestBlogsSection";
import { ContactSection } from "@/components/site/ContactSection";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "AiimanFolio Pro — Premium Portfolio & Blog" },
      { name: "description", content: "Senior product engineer crafting premium digital experiences. Portfolio, projects, and writing." },
      { property: "og:title", content: "AiimanFolio Pro — Premium Portfolio & Blog" },
      { property: "og:description", content: "Senior product engineer crafting premium digital experiences." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Alex Carter",
        jobTitle: "Senior Product Engineer",
        url: "/",
      }),
    }],
  }),
});

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ServicesSection />
        <StatsSection />
        <ExperienceTimeline />
        <ProjectsGrid limit={6} showFilters={false} />
        <TestimonialsSection />
        <LatestBlogsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
