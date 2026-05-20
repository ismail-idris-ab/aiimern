import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Alex shipped a brand and product experience that genuinely moved the needle. Our trial-to-paid conversion jumped 34%.",
    name: "Abba Aliyu",
    title: "Founder, SahlearnTech",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
  {
    quote:
      "The kind of partner you wish every project had — fast, opinionated, and obsessed with the details that matter.",
    name: "Priya Shah",
    title: "Head of Design, Lumen Labs",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
  {
    quote:
      "From discovery to launch in nine weeks. The site looks incredible and performs even better.",
    name: "Marco John",
    title: "VP Marketing, PriceEye",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-pad bg-surface/40">
      <div className="container-cf">
        <div className="max-w-2xl">
          <span className="chip">Testimonials</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
            What clients <span className="gradient-text">say</span>.
          </h2>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="card-cf p-7 flex flex-col">
              <Quote className="text-primary mb-4" size={28} />
              <blockquote className="text-foreground/90 leading-relaxed flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-[var(--border)]">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="size-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.title}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
