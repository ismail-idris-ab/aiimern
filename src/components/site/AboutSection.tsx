import { Briefcase, Code2, Award } from "lucide-react";

const stats = [
  { value: "4+", label: "Years Experience" },
  { value: "12+", label: "Projects Shipped" },
  { value: "6+", label: "Happy Clients" },
  { value: "100%", label: "Remote Ready" },
];

const cards = [
  { Icon: Briefcase, label: "Senior Engineer", sub: "Studio Lead" },
  { Icon: Code2, label: "Full-Stack", sub: "TS · React · Node" },
  { Icon: Award, label: "Award-winning", sub: "Awwwards × 3" },
];

export function AboutSection() {
  return (
    <section className="section-pad relative overflow-hidden" id="about">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, color-mix(in oklab, var(--primary) 8%, transparent), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container-cf px-6 md:px-12 relative">
        <div className="mb-12">
          <span className="chip">About me</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight max-w-2xl">
            A fullstack developer with a <span className="gradient-text">product mindset.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left — bio + stats */}
          <div className="space-y-8">
            <div className="space-y-4 text-muted-foreground leading-relaxed text-[1.05rem]">
              <p>
                I'm Ismail, a Full-Stack Developer based in Kaduna, Nigeria, specializing in the
                MERN stack — MongoDB, Express.js, React, and Node.js. I build purposeful web
                applications that solve real problems, with a particular focus on products tailored
                to Nigerian and African markets.
              </p>
              <p>
                My work sits at the intersection of clean engineering and thoughtful product design.
                Whether I'm architecting a RESTful API, designing an intuitive UI, or integrating
                third-party services like Paystack, I care deeply about the full user experience —
                from database schema to the last pixel on screen.
              </p>
              <p>
                My goal is to keep improving as a developer, build high-quality projects, and create
                digital solutions that are useful, professional, and impactful.
              </p>
              <p>
                Currently, I'm building Rotara, a fintech-adjacent platform for rotating group
                savings (ajo/esusu), bringing structure, transparency, and trust to one of Africa's
                most enduring financial traditions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--border)] bg-surface/40 p-5 backdrop-blur-sm"
                >
                  <div className="text-3xl font-display font-semibold gold-text">{value}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — feature cards */}
          <div className="flex flex-col gap-4">
            {cards.map(({ Icon, label, sub }) => (
              <div key={label} className="card-cf group flex items-center gap-5 p-6">
                <div className="grid shrink-0 place-items-center size-12 rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-lg leading-tight">{label}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{sub}</div>
                </div>
                <div className="shrink-0 w-1 h-10 rounded-full bg-primary/20 transition-colors group-hover:bg-primary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
