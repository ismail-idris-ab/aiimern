const stats = [
  { k: "120+", v: "Projects Delivered" },
  { k: "40+", v: "Happy Clients" },
  { k: "8+", v: "Years Experience" },
  { k: "12", v: "Industry Awards" },
];

export function StatsSection() {
  return (
    <section className="section-pad">
      <div className="container-cf">
        <div className="card-cf p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center bg-gradient-to-br from-surface to-surface-soft">
          {stats.map((s) => (
            <div key={s.v}>
              <div className="text-4xl md:text-5xl font-display font-semibold gradient-text">{s.k}</div>
              <div className="mt-2 text-xs md:text-sm uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
