const experience = [
  {
    role: "Full Stack Engineer",
    company: "Sahlearn Studio",
    period: "2025 — Present",
    desc: "Lead engineering on a multi-product design platform. Built the core renderer and shipped the v2 marketing system.",
  },
  {
    role: "Senior Frontend Engineer",
    company: "Lumen Labs",
    period: "2024 — 2025",
    desc: "Owned the design system and customer-facing dashboards. Cut median TTI by 48% across 3 flagship products.",
  },
  {
    role: "UI Engineer",
    company: "Independent.",
    period: "2023 — 2024",
    desc: "Designed and built marketing sites and brand experiences for Series A–C startups across the US and EU.",
  },
  {
    role: "Freelance Designer & Developer",
    company: "Independent",
    period: "2022 — 2023",
    desc: "Worked with different founders to launch their MVPs and first brand systems.",
  },
];

export function ExperienceTimeline() {
  return (
    <section className="section-pad bg-surface/40" id="experience">
      <div className="container-cf">
        <div className="max-w-2xl">
          <span className="chip">Career</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
            Work <span className="gradient-text">experience</span>.
          </h2>
        </div>

        <div className="mt-14 relative">
          <div
            className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-[var(--border)]"
            aria-hidden
          />
          <div className="space-y-10">
            {experience.map((e, i) => (
              <div
                key={e.role}
                className={`relative grid md:grid-cols-2 gap-6 md:gap-12 ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}
              >
                <div
                  className={`pl-10 md:pl-0 ${i % 2 === 1 ? "md:text-left md:[direction:ltr]" : "md:text-right"}`}
                >
                  <div className="card-cf p-6 inline-block text-left">
                    <div className="text-xs uppercase tracking-widest gold-text mb-2">
                      {e.period}
                    </div>
                    <h3 className="text-xl font-semibold">{e.role}</h3>
                    <div className="text-sm text-muted-foreground mt-1">{e.company}</div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
                  </div>
                </div>
                <div className="hidden md:block" />
                <span className="absolute left-3 md:left-1/2 top-6 -translate-x-1/2 size-3 rounded-full bg-primary shadow-[0_0_0_4px_var(--background),0_0_0_5px_var(--primary)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
