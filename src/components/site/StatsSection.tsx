import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

type Stat = {
  value: number;
  suffix: string;
  label: string;
};

const stats: Stat[] = [
  { value: 12, suffix: "+", label: "Projects Delivered" },
  { value: 8, suffix: "+", label: "Happy Clients" },
  { value: 4, suffix: "+", label: "Years Experience" },
  { value: 2, suffix: "", label: "Industry Awards" },
];

function CounterNumber({
  value,
  suffix,
  trigger,
}: {
  value: number;
  suffix: string;
  trigger: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const spring = useSpring(
    count,
    prefersReducedMotion ? { duration: 0, bounce: 0 } : { duration: 1500, bounce: 0 },
  );
  const rounded = useTransform(spring, Math.round);

  useEffect(() => {
    if (trigger) count.set(value);
  }, [trigger, value]); // count is a stable MotionValue ref — omitted intentionally

  return (
    <div className="text-4xl md:text-5xl font-display font-semibold gradient-text">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </div>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section className="section-pad">
      <div className="container-cf">
        <div
          ref={ref}
          className="card-cf p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center bg-gradient-to-br from-surface to-surface-soft"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <CounterNumber value={s.value} suffix={s.suffix} trigger={inView} />
              <div className="mt-2 text-xs md:text-sm uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
