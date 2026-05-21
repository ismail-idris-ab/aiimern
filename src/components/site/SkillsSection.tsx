import { motion, useReducedMotion } from "framer-motion";

const skills = [
  { name: "Frontend Engineering", level: 90 },
  { name: "Product Design", level: 88 },
  { name: "Backend & APIs", level: 80 },
  { name: "Motion & Interaction", level: 80 },
  { name: "Design Systems", level: 92 },
  { name: "Performance & SEO", level: 86 },
];

export function SkillsSection() {
  const prefersReducedMotion = useReducedMotion();

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
          {skills.map((s, index) => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{s.name}</span>
                <span className="gold-text font-semibold">{s.level}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.level}%` }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.8, ease: "easeOut", delay: index * 0.08 }
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
