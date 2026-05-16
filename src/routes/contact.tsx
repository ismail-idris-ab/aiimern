import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ContactSection } from "@/components/site/ContactSection";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => {
    const title = "Contact — AiimanFolio.Pro";
    const description = "Have a project in mind? Get in touch with Aiiman about product design, full-stack engineering, or a new collaboration.";
    const image = "/og-default.jpg";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/contact" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: "AiimanFolio.Pro — Contact" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: "/contact" }],
    };
  },
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
