import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ContactSection } from "@/components/site/ContactSection";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — AiimanFolio Pro" },
      { name: "description", content: "Get in touch about design, engineering, or a new project." },
      { property: "og:title", content: "Contact — AiimanFolio Pro" },
      { property: "og:description", content: "Get in touch about design, engineering, or a new project." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
