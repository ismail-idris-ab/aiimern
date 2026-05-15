import { Layout, Code, Smartphone, Search, Palette, Rocket } from "lucide-react";

const services = [
  { Icon: Layout, title: "Web Design", desc: "Bespoke design systems, landing pages, and brand-first marketing sites." },
  { Icon: Code, title: "Web Development", desc: "Type-safe React apps, server functions, and production-grade infrastructure." },
  { Icon: Smartphone, title: "Mobile-First UI", desc: "Responsive interfaces engineered to feel native on every screen." },
  { Icon: Palette, title: "Brand Identity", desc: "Logo, type, and visual systems that translate beautifully to product." },
  { Icon: Search, title: "SEO & Performance", desc: "Core Web Vitals, structured data, and content strategy that ranks." },
  { Icon: Rocket, title: "Launch Strategy", desc: "From private beta to public launch — positioning, copy, and funnel." },
];

export function ServicesSection() {
  return (
    <section className="section-pad" id="services">
      <div className="container-cf">
        <div className="max-w-2xl">
          <span className="chip">What I do</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
            Services tailored for <span className="gradient-text">teams that ship</span>.
          </h2>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ Icon, title, desc }) => (
            <article key={title} className="card-cf p-7 group">
              <div className="grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
