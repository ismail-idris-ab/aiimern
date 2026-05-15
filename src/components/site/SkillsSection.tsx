const skills = [
  { name: "Frontend Engineering", level: 96 },
  { name: "Product Design", level: 88 },
  { name: "Backend & APIs", level: 84 },
  { name: "Motion & Interaction", level: 80 },
  { name: "Design Systems", level: 92 },
  { name: "Performance & SEO", level: 86 },
];

export function SkillsSection() {
  return (
    <section className="section-pad bg-surface/40">
      <div className="container-cf">
        <div className="max-w-2xl">
          <span className="chip">Expertise</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
            Skills sharpened over <span className="gradient-text">years of shipping</span>.
          </h2>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-x-12 gap-y-6">
          {skills.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{s.name}</span>
                <span className="gold-text font-semibold">{s.level}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-700"
                  style={{ width: `${s.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
