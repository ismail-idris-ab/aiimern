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
  head: () => {
    const title = "AiimanFolio.Pro — Premium Portfolio & Blog by Aiiman";
    const description = "Senior product engineer crafting premium digital experiences. Explore selected projects, services, and writing on design, engineering, and shipping.";
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
      scripts: [{
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
      }],
    };
  },
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
