# Group 1 — Quick Wins Design Spec

**Date:** 2026-05-16  
**Scope:** Animated counters, animated skill bars, sitemap BASE_URL fix  
**Stack:** TanStack Start + Vite + React 19 + Framer Motion  
**Color/style:** No changes — existing tokens and classes only

---

## 1. Framer Motion setup

Install `framer-motion` as a production dependency.

```bash
bun add framer-motion
```

- Import via named imports only (`import { motion, useInView, useSpring, useMotionValue } from "framer-motion"`) — tree-shakes unused exports.
- No global provider needed.
- No config file changes.

---

## 2. Animated counters — `StatsSection`

**File:** `src/components/site/StatsSection.tsx`

### Data shape

```ts
type Stat = {
  value: number; // numeric target (e.g. 120)
  suffix: string; // e.g. "+" or ""
  label: string;
};

const stats: Stat[] = [
  { value: 120, suffix: "+", label: "Projects Delivered" },
  { value: 40, suffix: "+", label: "Happy Clients" },
  { value: 8, suffix: "+", label: "Years Experience" },
  { value: 12, suffix: "", label: "Industry Awards" },
];
```

### Animation behavior

- Section root gets a `ref` passed to `useInView({ once: true, amount: 0.4 })`.
- When `inView` becomes `true`, each counter starts counting from `0` to `stat.value`.
- Each counter is a separate client-side `<CounterNumber>` sub-component using `useMotionValue` + `useSpring`:
  ```ts
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const spring = useSpring(count, { duration: 1500, bounce: 0 });
  ```
  On `inView`, set `count.set(stat.value)`.
- Display: `{rounded}{suffix}` — e.g. `"120+"`.
- `prefers-reduced-motion`: wrap animation trigger in `if (!prefersReducedMotion) { count.set(stat.value) } else { count.set(stat.value) /* instant */ }`. Use the `useReducedMotion()` hook from Framer Motion — if true, set the value immediately (no spring).

### No structural/style changes

Existing JSX structure and Tailwind classes remain identical. Only the displayed number becomes a motion value.

---

## 3. Animated skill bars — `SkillsSection`

**File:** `src/components/site/SkillsSection.tsx`

### Animation behavior

- Replace the static inner fill `<div>` with `<motion.div>`.
- Props:
  ```tsx
  <motion.div
    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
    initial={{ width: 0 }}
    whileInView={{ width: `${s.level}%` }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.08 }}
  />
  ```
- Stagger: `delay: index * 0.08` — first bar fires at 0ms, sixth at 400ms.
- `prefers-reduced-motion`: use `useReducedMotion()`. If true, render `style={{ width: \`${s.level}%\` }}` with no transition instead of the motion props.

### No structural/style changes

Outer wrapper, text labels, percentage display — all unchanged.

---

## 4. Sitemap BASE_URL fix

**File:** `src/routes/sitemap[.]xml.ts`

```ts
// Before
const BASE_URL = "";

// After
const BASE_URL = "https://aiimanfolio.pro";
```

One-line change. No other modifications.

---

## Acceptance criteria

- [ ] Stats section: numbers count up from 0 when scrolled into view, fire once only.
- [ ] Stats section: `"+"` suffix appears immediately (not counted), only the number animates.
- [ ] Skill bars: bars expand left-to-right on viewport enter, staggered, fire once only.
- [ ] Both: with OS reduced-motion enabled, final values render instantly, no animation.
- [ ] Sitemap: `https://aiimanfolio.pro/` appears as the base in every sitemap URL.
- [ ] No color, font, spacing, or layout changes anywhere.
- [ ] `bun run build` succeeds with no type errors.

---

## Files changed

| File                                    | Change              |
| --------------------------------------- | ------------------- |
| `package.json` / `bun.lock`             | Add `framer-motion` |
| `src/components/site/StatsSection.tsx`  | Animated counters   |
| `src/components/site/SkillsSection.tsx` | Animated skill bars |
| `src/routes/sitemap[.]xml.ts`           | Fix BASE_URL        |
