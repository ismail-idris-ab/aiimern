import { Briefcase, Code2, Award } from "lucide-react";

export function AboutSection() {
  return (
    <section className="section-pad" id="about">
      <div className="container-cf grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <span className="chip">About me</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
            A product engineer with a <span className="gradient-text">designer's eye</span>.
          </h2>
        </div>
        <div className="lg:col-span-7 space-y-5 text-muted-foreground leading-relaxed text-[1.05rem]">
          <p>
            For nearly a decade, I've helped startups and global brands turn complex
            problems into clean, considered products. I lead with curiosity, ship with
            craft, and treat every pixel as a deliberate choice.
          </p>
          <p>
            My toolkit spans modern React, type-safe APIs, and motion design — but my
            real obsession is the seam between engineering and storytelling.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 pt-4">
            {[
              { Icon: Briefcase, label: "Senior Engineer", sub: "Studio Lead" },
              { Icon: Code2, label: "Full-Stack", sub: "TS · React · Node" },
              { Icon: Award, label: "Award-winning", sub: "Awwwards × 3" },
            ].map(({ Icon, label, sub }) => (
              <div key={label} className="card-cf p-5">
                <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary mb-3">
                  <Icon size={18} />
                </div>
                <div className="font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
