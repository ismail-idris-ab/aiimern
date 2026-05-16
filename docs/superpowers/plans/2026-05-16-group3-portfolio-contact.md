# Group 3 — Portfolio + Contact Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move projects to Supabase with rich case-study detail pages, and harden the contact form with honeypot + Cloudflare KV rate limiting + Resend email notification.

**Architecture:** Projects are fetched client-side from a new `projects` Supabase table; detail pages use TanStack Router SSR loaders with the existing `parseMarkdown` utility. Contact form submits to a `createServerFn` server function that checks a honeypot, enforces per-IP rate limiting via Cloudflare KV, inserts to Supabase via the admin client, and sends an email via Resend.

**Tech Stack:** TanStack Start, React 19, Supabase (public + admin client), Cloudflare KV, Resend REST API, `vinxi/http` for h3 event access, existing `parseMarkdown` from `src/lib/markdown.ts`

---

## File map

| File | Action |
|---|---|
| `src/integrations/supabase/types.ts` | Modify — add `projects` table type |
| `src/components/site/ProjectsGrid.tsx` | Rewrite — Supabase fetch, dynamic filters, skeleton, cards link to slug |
| `src/routes/projects.$slug.tsx` | Create — SSR loader + case study page layout |
| `src/lib/contact-action.ts` | Create — server function: honeypot + KV rate limit + Supabase + Resend |
| `src/components/site/ContactSection.tsx` | Modify — add honeypot field, call server function |
| `wrangler.jsonc` | Modify — add KV namespace binding + NOTIFICATION_EMAIL var |

---

## Prerequisites (manual steps before starting)

**1. Supabase SQL** — Run in the Supabase dashboard SQL editor:

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  category text not null,
  tags text[] default '{}',
  cover_image text,
  live_url text,
  github_url text,
  featured boolean default false,
  status text default 'published' check (status in ('draft', 'published')),
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table projects enable row level security;
create policy "public read" on projects for select using (status = 'published');
```

**2. Cloudflare KV namespace** — Run once, copy the `id` value:

```bash
npx wrangler kv namespace create CONTACT_RATE_KV
```

**3. Resend API key** — Get from resend.com dashboard. For local dev, add to `.dev.vars`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

For production: `npx wrangler secret put RESEND_API_KEY`

---

## Task 1: Add `projects` type to Supabase types

**Files:**
- Modify: `src/integrations/supabase/types.ts:107-127`

- [ ] **Step 1: Add `projects` table type**

In `src/integrations/supabase/types.ts`, insert the `projects` block after the `newsletter_subscribers` closing brace (after line 127) and before the closing `}` of `Tables`:

```typescript
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          category: string
          tags: string[]
          cover_image: string | null
          live_url: string | null
          github_url: string | null
          featured: boolean
          status: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          category: string
          tags?: string[]
          cover_image?: string | null
          live_url?: string | null
          github_url?: string | null
          featured?: boolean
          status?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          category?: string
          tags?: string[]
          cover_image?: string | null
          live_url?: string | null
          github_url?: string | null
          featured?: boolean
          status?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 2: Verify TypeScript accepts the change**

```bash
npx tsc --noEmit
```

Expected: no errors related to `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: add projects table type to Supabase types"
```

---

## Task 2: Rewrite ProjectsGrid with Supabase data

**Files:**
- Rewrite: `src/components/site/ProjectsGrid.tsx`

- [ ] **Step 1: Replace file with new implementation**

Write `src/components/site/ProjectsGrid.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Project = {
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  cover_image: string | null;
  live_url: string | null;
  github_url: string | null;
  featured: boolean;
  sort_order: number;
};

export function ProjectsGrid({ limit, showFilters = true }: { limit?: number; showFilters?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase
      .from("projects")
      .select("title, slug, excerpt, category, tags, cover_image, live_url, github_url, featured, sort_order")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setProjects(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );

  const filtered = useMemo(() => {
    const base = filter === "All" ? projects : projects.filter((p) => p.category === filter);
    return limit ? base.slice(0, limit) : base;
  }, [projects, filter, limit]);

  return (
    <section className="section-pad" id="projects">
      <div className="container-cf">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="chip">Selected work</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold">
              Projects I'm <span className="gradient-text">proud of</span>.
            </h2>
          </div>
          {!limit && (
            <Link to="/projects" className="hidden md:inline-flex btn-ghost">View all</Link>
          )}
        </div>

        {showFilters && !loading && categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: limit ?? 6 }).map((_, i) => (
                <div key={i} className="card-cf overflow-hidden">
                  <div className="aspect-[4/3] animate-pulse bg-surface-soft" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-16 rounded animate-pulse bg-surface-soft" />
                    <div className="h-4 w-3/4 rounded animate-pulse bg-surface-soft" />
                  </div>
                </div>
              ))
            : filtered.map((p) => (
                <Link
                  key={p.slug}
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="card-cf overflow-hidden group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {p.cover_image ? (
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-surface-soft" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-primary mb-1">{p.category}</div>
                        <h3 className="text-lg font-semibold">{p.title}</h3>
                      </div>
                      <span className="grid place-items-center size-10 rounded-full border border-[var(--border)] text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-surface-soft text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {limit && !loading && (
          <div className="mt-10 text-center">
            <Link to="/projects" className="btn-ghost">Browse all projects</Link>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `ProjectsGrid.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/ProjectsGrid.tsx
git commit -m "feat: load projects from Supabase with skeleton loading and slug links"
```

---

## Task 3: Create project detail page

**Files:**
- Create: `src/routes/projects.$slug.tsx`

- [ ] **Step 1: Create the file**

Write `src/routes/projects.$slug.tsx`:

```tsx
import { useState, useEffect } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { parseMarkdown } from "@/lib/markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!data) throw redirect({ to: "/projects" });
    return { project: data };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.project;
    if (!p) return {};
    const title = `${p.title} — AiimanFolio.Pro`;
    return {
      meta: [
        { title },
        { name: "description", content: p.excerpt ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: p.excerpt ?? "" },
        { property: "og:image", content: p.cover_image ?? "/og-default.jpg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: p.excerpt ?? "" },
        { name: "twitter:image", content: p.cover_image ?? "/og-default.jpg" },
      ],
      links: [{ rel: "canonical", href: `/projects/${p.slug}` }],
    };
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { project: p } = Route.useLoaderData();
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (p.content) {
      parseMarkdown(p.content).then(({ html }) => setHtml(html));
    }
  }, [p.content]);

  return (
    <>
      <Navbar />
      <main>
        {p.cover_image && (
          <div className="w-full aspect-[21/9] overflow-hidden">
            <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container-cf max-w-4xl py-16">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            All projects
          </Link>

          <span className="chip">{p.category}</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
            {p.title}
          </h1>

          {p.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{p.excerpt}</p>
          )}

          {p.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t: string) => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {(p.live_url || p.github_url) && (
            <div className="mt-6 flex gap-3 flex-wrap">
              {p.live_url && (
                <a
                  href={p.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold inline-flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  Live site
                </a>
              )}
              {p.github_url && (
                <a
                  href={p.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <Github size={14} />
                  Source
                </a>
              )}
            </div>
          )}

          {html && (
            <div className="prose-cf mt-12" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `projects.$slug.tsx`.

- [ ] **Step 3: Verify route tree regenerates**

```bash
bun run dev
```

Check that `src/routeTree.gen.ts` now includes `/projects/$slug`. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/projects.$slug.tsx src/routeTree.gen.ts
git commit -m "feat: add project detail / case study page route"
```

---

## Task 4: Create contact server function

**Files:**
- Create: `src/lib/contact-action.ts`

- [ ] **Step 1: Create the server function**

Write `src/lib/contact-action.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { getEvent } from "vinxi/http";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10).max(2000),
  website: z.string().default(""),
});

type ContactResult = { ok: true } | { ok: false; error: string };

export const submitContact = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ContactResult> => {
    // 1. Honeypot — silently succeed so bots think it worked
    if (data.website) return { ok: true };

    // 2. Cloudflare KV rate limiting (3 submissions per IP per hour)
    try {
      const webReq = getWebRequest();
      const ip = webReq?.headers.get("cf-connecting-ip") ?? "unknown";
      const event = getEvent();
      const cfEnv = (event?.context as any)?.cloudflare?.env;
      const kv: KVNamespace | undefined = cfEnv?.CONTACT_RATE_KV;

      if (kv) {
        const key = `contact_rate:${ip}`;
        const raw = await kv.get(key);
        const count = raw ? parseInt(raw, 10) : 0;
        if (count >= 3) {
          return { ok: false, error: "Too many requests. Please try again later." };
        }
        const now = new Date();
        const secondsUntilNextHour = (60 - now.getMinutes()) * 60 - now.getSeconds();
        await kv.put(key, String(count + 1), {
          expirationTtl: secondsUntilNextHour > 0 ? secondsUntilNextHour : 3600,
        });
      }
    } catch {
      // KV unavailable in dev — skip rate limiting
    }

    // 3. Insert to Supabase
    const { error: dbError } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || "General inquiry",
      message: data.message,
    });
    if (dbError) return { ok: false, error: "Could not send. Please try again." };

    // 4. Resend notification (fire-and-forget — don't fail submission if email fails)
    const resendKey = process.env.RESEND_API_KEY;
    const notifEmail = process.env.NOTIFICATION_EMAIL;
    if (resendKey && notifEmail) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@aiimanfolio.pro",
          to: notifEmail,
          subject: `New contact: ${data.subject || "General inquiry"}`,
          html: `<p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p><p><strong>Subject:</strong> ${data.subject || "General inquiry"}</p><p><strong>Message:</strong></p><p>${data.message.replace(/\n/g, "<br>")}</p>`,
        }),
      }).catch(() => {});
    }

    return { ok: true };
  });
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors. Note: `KVNamespace` is a Cloudflare Workers global type — if TypeScript complains, check that `@cloudflare/workers-types` is installed (it comes with `wrangler`). If needed: `bun add -d @cloudflare/workers-types`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/contact-action.ts
git commit -m "feat: add contact server function with honeypot, KV rate limit, and Resend"
```

---

## Task 5: Update ContactSection to use server function

**Files:**
- Rewrite: `src/components/site/ContactSection.tsx`

- [ ] **Step 1: Rewrite the component**

Write `src/components/site/ContactSection.tsx`:

```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Loader2, Check } from "lucide-react";
import { submitContact } from "@/lib/contact-action";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10, "Minimum 10 characters").max(2000),
  website: z.string().default(""),
});

type FormData = z.infer<typeof schema>;

export function ContactSection() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  const onSubmit = async (values: FormData) => {
    setError(null);
    const result = await submitContact({ data: values });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
    reset();
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <section className="section-pad" id="contact">
      <div className="container-cf grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <span className="chip">Contact</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
            Let's build something <span className="gradient-text">remarkable</span>.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Tell me about your project. I'll get back within 24 hours with thoughts,
            timelines, and next steps.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { Icon: Mail, label: "Email", value: "hello@craftfolio.pro" },
              { Icon: Phone, label: "Phone", value: "+1 (415) 555-0142" },
              { Icon: MapPin, label: "Location", value: "Remote · San Francisco" },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 card-cf p-7 md:p-9 space-y-5">
          {/* Honeypot — hidden from real users, bots fill it */}
          <input
            {...register("website")}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
            aria-hidden="true"
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Name" error={errors.name?.message}>
              <input {...register("name")} className="cf-input" placeholder="Your name" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} type="email" className="cf-input" placeholder="you@email.com" />
            </Field>
          </div>
          <Field label="Subject" error={errors.subject?.message}>
            <input {...register("subject")} className="cf-input" placeholder="Project inquiry" />
          </Field>
          <Field label="Message" error={errors.message?.message}>
            <textarea {...register("message")} rows={6} className="cf-input resize-none" placeholder="Tell me a bit about your project, timeline, and budget…" />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={isSubmitting || sent} className="btn-gold w-full sm:w-auto disabled:opacity-60">
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : sent ? (
              <><Check size={16} /> Message sent</>
            ) : (
              <><Send size={16} /> Send message</>
            )}
          </button>

          <style>{`
            .cf-input {
              width: 100%;
              background: var(--surface-soft);
              border: 1px solid var(--border);
              border-radius: 0.75rem;
              padding: 0.75rem 1rem;
              color: var(--foreground);
              font-size: 0.95rem;
              transition: border-color .2s ease, background .2s ease;
            }
            .cf-input::placeholder { color: var(--muted-foreground); }
            .cf-input:focus { outline: none; border-color: var(--primary); background: color-mix(in oklab, var(--primary) 5%, var(--surface-soft)); }
          `}</style>
        </form>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/ContactSection.tsx
git commit -m "feat: add honeypot and wire contact form to server function"
```

---

## Task 6: Update wrangler.jsonc

**Files:**
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Add KV binding and NOTIFICATION_EMAIL**

Replace `wrangler.jsonc` content with:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "src/server.ts",
  "kv_namespaces": [
    { "binding": "CONTACT_RATE_KV", "id": "<paste-kv-namespace-id-here>" }
  ],
  "vars": {
    "NOTIFICATION_EMAIL": "ismailidris285@gmail.com"
  }
}
```

Replace `<paste-kv-namespace-id-here>` with the KV namespace `id` from the prerequisite step (`npx wrangler kv namespace create CONTACT_RATE_KV` outputs it).

- [ ] **Step 2: Commit**

```bash
git add wrangler.jsonc
git commit -m "chore: add Cloudflare KV binding and notification email var"
```

---

## Task 7: Production build verification

**Files:** None (verification only)

- [ ] **Step 1: Run production build**

```bash
bun run build
```

Expected: exits 0, no TypeScript errors, output includes `projects.$slug` chunk.

- [ ] **Step 2: Verify route tree includes new routes**

Check `src/routeTree.gen.ts` contains both `/projects/$slug`.

- [ ] **Step 3: Commit routeTree if not already committed**

```bash
git add src/routeTree.gen.ts
git status
```

Only commit if there are uncommitted changes:

```bash
git commit -m "chore: regenerate route tree for projects slug route"
```

---

## Self-review checklist (controller verifies after all tasks)

- [ ] Spec §1 (Supabase table type): Task 1 ✓
- [ ] Spec §2 (ProjectsGrid dynamic): Task 2 ✓
- [ ] Spec §3 (project detail page): Task 3 ✓
- [ ] Spec §4a (server function): Task 4 ✓
- [ ] Spec §4b (KV access via `getEvent`): Task 4 ✓
- [ ] Spec §4c (wrangler.jsonc): Task 6 ✓
- [ ] Spec §4d (ContactSection honeypot + server fn call): Task 5 ✓
- [ ] No color/font/spacing/layout token changes: verified
- [ ] Build passes: Task 7 ✓
