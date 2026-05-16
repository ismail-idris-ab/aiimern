# Group 1 — Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add viewport-triggered animated counters and skill bars via Framer Motion, and fix the sitemap base URL.

**Architecture:** Framer Motion is added as a production dep. `StatsSection` gains a `CounterNumber` sub-component that springs from 0 → target when the section enters the viewport. `SkillsSection` replaces the static fill div with `motion.div` + `whileInView`. Both respect `prefers-reduced-motion`. Sitemap gets a one-line URL fix.

**Tech Stack:** Framer Motion 11+, React 19, TanStack Start / Vite, TypeScript strict, Bun

---

## File map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/components/site/StatsSection.tsx` | Animated counter numbers |
| Modify | `src/components/site/SkillsSection.tsx` | Animated skill bar fills |
| Modify | `src/routes/sitemap[.]xml.ts` | Fix BASE_URL |
| Auto-updated | `package.json`, `bun.lock` | framer-motion dep |

No new files. No structural changes to JSX layout or CSS classes.

---

## Task 1: Install Framer Motion

**Files:**
- Modify: `package.json` (via bun)

- [ ] **Step 1: Install the package**

```bash
bun add framer-motion
```

Expected output: `bun add v...` with `framer-motion` listed. No errors.

- [ ] **Step 2: Verify TypeScript can resolve it**

```bash
bun run build 2>&1 | head -20
```

Expected: build succeeds or fails only on pre-existing errors (not on `framer-motion` import resolution).

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add framer-motion"
```

---

## Task 2: Animated counters — StatsSection

**Files:**
- Modify: `src/components/site/StatsSection.tsx`

- [ ] **Step 1: Replace the entire file with the animated version**

```tsx
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
  { value: 120, suffix: "+", label: "Projects Delivered" },
  { value: 40,  suffix: "+", label: "Happy Clients" },
  { value: 8,   suffix: "+", label: "Years Experience" },
  { value: 12,  suffix: "",  label: "Industry Awards" },
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
  }, [trigger, value, count]);

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
```

- [ ] **Step 2: Type-check**

```bash
bun run lint
```

Expected: zero errors on `StatsSection.tsx`.

- [ ] **Step 3: Dev server smoke test**

```bash
bun run dev
```

Open `http://localhost:5173`, scroll to the Stats section. Numbers should count up from 0 when the card enters the viewport. Reload and scroll past — they should NOT re-trigger.

- [ ] **Step 4: Commit**

```bash
git add src/components/site/StatsSection.tsx
git commit -m "feat: animate stats counters on viewport enter"
```

---

## Task 3: Animated skill bars — SkillsSection

**Files:**
- Modify: `src/components/site/SkillsSection.tsx`

- [ ] **Step 1: Replace the entire file with the animated version**

```tsx
import { motion, useReducedMotion } from "framer-motion";

const skills = [
  { name: "Frontend Engineering", level: 96 },
  { name: "Product Design", level: 88 },
  { name: "Backend & APIs", level: 84 },
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
            Skills sharpened over{" "}
            <span className="gradient-text">years of shipping</span>.
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
```

- [ ] **Step 2: Type-check**

```bash
bun run lint
```

Expected: zero errors on `SkillsSection.tsx`.

- [ ] **Step 3: Dev server smoke test**

Open `http://localhost:5173`, scroll to the Skills section. Each bar should expand left-to-right in a staggered sequence (0ms, 80ms, 160ms … 400ms offsets). Should NOT re-trigger on scroll back up.

- [ ] **Step 4: Reduced-motion check**

In browser DevTools → Rendering → Enable "Emulate CSS media feature prefers-reduced-motion". Reload. Bars should render at full width instantly — no animation.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/SkillsSection.tsx
git commit -m "feat: animate skill bars on viewport enter"
```

---

## Task 4: Fix sitemap BASE_URL

**Files:**
- Modify: `src/routes/sitemap[.]xml.ts`

- [ ] **Step 1: Update the constant**

Find this line near the top of the file:

```ts
const BASE_URL = "";
```

Replace with:

```ts
const BASE_URL = "https://aiimanfolio.pro";
```

- [ ] **Step 2: Verify sitemap output locally**

```bash
bun run dev
```

Open `http://localhost:5173/sitemap.xml`. Every `<loc>` entry should start with `https://aiimanfolio.pro/`. Example:

```xml
<loc>https://aiimanfolio.pro/</loc>
<loc>https://aiimanfolio.pro/blog</loc>
```

- [ ] **Step 3: Commit**

```bash
git add "src/routes/sitemap[.]xml.ts"
git commit -m "fix: set sitemap BASE_URL to https://aiimanfolio.pro"
```

---

## Task 5: Production build verification

- [ ] **Step 1: Run full build**

```bash
bun run build
```

Expected: exits 0, no TypeScript errors, no Vite warnings about missing modules.

- [ ] **Step 2: Check bundle — framer-motion must only load on pages that use it**

After build, inspect `.output/` or `dist/` for chunk sizes. `framer-motion` is ~30KB gzipped. Acceptable — it ships on every page since `StatsSection` and `SkillsSection` are on the landing page.

- [ ] **Step 3: Final commit if anything was missed**

```bash
git status
```

If clean, nothing to commit. If any stragglers, add and commit with `chore: group1 cleanup`.
