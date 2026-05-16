# Group 3 — Portfolio + Contact Hardening Design Spec

**Date:** 2026-05-16
**Scope:** Projects from Supabase, project detail/case-study pages, contact form hardening (honeypot + Cloudflare KV rate limiting + Resend email notification)
**Stack:** TanStack Start + Vite + React 19 + Supabase + Cloudflare Workers + Cloudflare KV + Resend
**Color/style:** No changes — existing tokens and classes only

---

## 1. Supabase `projects` table

### SQL (run once in Supabase dashboard)

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

### Supabase types (`src/integrations/supabase/types.ts`)

Add `projects` table type (manually, same pattern as `newsletter_subscribers`):

```ts
projects: {
  Row: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    category: string;
    tags: string[];
    cover_image: string | null;
    live_url: string | null;
    github_url: string | null;
    featured: boolean;
    status: string;
    sort_order: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    category: string;
    tags?: string[];
    cover_image?: string | null;
    live_url?: string | null;
    github_url?: string | null;
    featured?: boolean;
    status?: string;
    sort_order?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string | null;
    category?: string;
    tags?: string[];
    cover_image?: string | null;
    live_url?: string | null;
    github_url?: string | null;
    featured?: boolean;
    status?: string;
    sort_order?: number;
    created_at?: string;
  };
  Relationships: [];
};
```

---

## 2. ProjectsGrid — dynamic data

**File modified:** `src/components/site/ProjectsGrid.tsx`

### Data loading

Replace static `PROJECTS` array with Supabase fetch:

```ts
const [projects, setProjects] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);

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
```

### Project type

```ts
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
```

### Filter buttons

Derived from fetched data — no hardcoded `FILTERS` constant:

```ts
const categories = useMemo(
  () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
  [projects]
);
```

### Loading state

While `loading`, render a grid of 6 skeleton cards:

```tsx
<div className="card-cf aspect-[4/3] animate-pulse" />
```

### Card links

`<article>` becomes `<Link to="/projects/$slug" params={{ slug: p.slug }}>` so the whole card is clickable. Remove the static `ArrowUpRight` button's non-functional wrapper; keep the icon inside.

---

## 3. Project detail page

**New file:** `src/routes/projects.$slug.tsx`

### Loader (SSR)

```ts
loader: async ({ params }) => {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();
  if (!data) throw redirect({ to: "/projects" });
  return { project: data };
}
```

### Component

```tsx
const { project } = Route.useLoaderData();
const [html, setHtml] = useState("");

useEffect(() => {
  if (project.content) {
    parseMarkdown(project.content).then(({ html }) => setHtml(html));
  }
}, [project.content]);
```

### Layout

```tsx
<>
  <Navbar />
  <main>
    {/* Hero image */}
    {project.cover_image && (
      <div className="w-full aspect-[21/9] overflow-hidden">
        <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
      </div>
    )}

    <div className="container-cf max-w-4xl py-16">
      {/* Back link */}
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={14} /> All projects
      </Link>

      {/* Meta */}
      <span className="chip">{project.category}</span>
      <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">{project.title}</h1>
      {project.excerpt && <p className="mt-4 text-lg text-muted-foreground">{project.excerpt}</p>}

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((t: string) => (
          <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground">#{t}</span>
        ))}
      </div>

      {/* CTA links */}
      <div className="mt-6 flex gap-3 flex-wrap">
        {project.live_url && (
          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2">
            <ExternalLink size={14} /> Live site
          </a>
        )}
        {project.github_url && (
          <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
            <Github size={14} /> Source
          </a>
        )}
      </div>

      {/* Case study content */}
      {html && (
        <div className="prose-cf mt-12" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  </main>
  <Footer />
</>
```

### `head()` export

```ts
head: ({ loaderData }) => {
  const { project } = loaderData;
  const title = `${project.title} — AiimanFolio.Pro`;
  return {
    meta: [
      { title },
      { name: "description", content: project.excerpt ?? "" },
      { property: "og:title", content: title },
      { property: "og:description", content: project.excerpt ?? "" },
      { property: "og:image", content: project.cover_image ?? "/og-default.jpg" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `/projects/${project.slug}` }],
  };
},
```

---

## 4. Contact form hardening

### 4a. Server function — `src/lib/contact-action.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10).max(2000),
  website: z.string().default(""), // honeypot
});

export const submitContact = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }) => {
    // 1. Honeypot check
    if (data.website) return { ok: true }; // silently succeed

    // 2. Rate limiting via Cloudflare KV
    const request = getWebRequest();
    const ip = request?.headers.get("CF-Connecting-IP") ?? "unknown";
    const kv = (globalThis as any).CONTACT_RATE_KV as KVNamespace | undefined;

    if (kv) {
      const key = `contact_rate:${ip}`;
      const raw = await kv.get(key);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= 3) return { ok: false, error: "Too many requests. Try again later." };
      const now = new Date();
      const secondsUntilNextHour = (60 - now.getMinutes()) * 60 - now.getSeconds();
      await kv.put(key, String(count + 1), { expirationTtl: secondsUntilNextHour || 3600 });
    }

    // 3. Insert to Supabase
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || "General inquiry",
      message: data.message,
    });
    if (error) return { ok: false, error: "Could not send. Please try again." };

    // 4. Resend notification
    const resendKey = process.env.RESEND_API_KEY;
    const notifEmail = process.env.NOTIFICATION_EMAIL;
    if (resendKey && notifEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "noreply@aiimanfolio.pro",
          to: notifEmail,
          subject: `New contact: ${data.subject || "General inquiry"}`,
          html: `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Message:</strong></p><p>${data.message.replace(/\n/g, "<br>")}</p>`,
        }),
      }).catch(() => {}); // don't fail submission if email fails
    }

    return { ok: true };
  });
```

### 4b. Cloudflare KV access pattern

Cloudflare Workers KV bindings are available as globals at runtime. Access the KV namespace directly:

```ts
const kv = (globalThis as any).CONTACT_RATE_KV as KVNamespace | undefined;
```

`RESEND_API_KEY` and `NOTIFICATION_EMAIL` are accessed via `process.env` — Cloudflare Workers supports this via the vite plugin.

### 4c. `wrangler.jsonc` changes

Add KV namespace binding:

```jsonc
"kv_namespaces": [
  { "binding": "CONTACT_RATE_KV", "id": "<kv-namespace-id>" }
]
```

Also add vars:

```jsonc
"vars": {
  "NOTIFICATION_EMAIL": "ismailidris285@gmail.com"
}
```

`RESEND_API_KEY` goes in `.dev.vars` (local) and as a Cloudflare secret (production): `wrangler secret put RESEND_API_KEY`.

### 4d. `ContactSection.tsx` changes

1. Add hidden honeypot field:
```tsx
<input
  name="website"
  tabIndex={-1}
  autoComplete="off"
  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
  {...register("website")}
/>
```

2. Update `schema` to include `website: z.string().default("")`.

3. Replace direct Supabase insert with `submitContact({ data: values })` call.

4. Error/success handling unchanged — same `setSent` / `setError` pattern.

---

## 5. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `.dev.vars` + CF secret | Resend API authentication |
| `NOTIFICATION_EMAIL` | `wrangler.jsonc` vars | Email address to notify on contact |
| `CONTACT_RATE_KV` | `wrangler.jsonc` kv_namespaces | KV binding for rate limiting |

---

## Files changed

| File | Action |
|------|--------|
| `src/integrations/supabase/types.ts` | Add `projects` table type |
| `src/components/site/ProjectsGrid.tsx` | Replace static data with Supabase fetch; cards link to `/projects/$slug` |
| `src/routes/projects.$slug.tsx` | Create — SSR loader + case study layout |
| `src/lib/contact-action.ts` | Create — server function with honeypot + KV rate limit + Resend |
| `src/components/site/ContactSection.tsx` | Add honeypot field; call server function instead of direct Supabase insert |
| `wrangler.jsonc` | Add KV binding + NOTIFICATION_EMAIL var |

No color, font, spacing, or layout token changes.

---

## Acceptance criteria

- [ ] `/projects` grid loads from Supabase; shows skeleton while loading
- [ ] Filter buttons derive from fetched categories
- [ ] Project cards link to `/projects/$slug`
- [ ] `/projects/[slug]` renders cover image, meta, tags, live/GitHub links, markdown content
- [ ] 404 (not found or draft) redirects to `/projects`
- [ ] Contact form honeypot: filled honeypot = silent success, nothing inserted
- [ ] Contact form rate limit: 4th submission within same hour returns error message
- [ ] Contact form success: message inserted to Supabase + Resend email sent
- [ ] `bun run build` exits 0, no type errors
- [ ] No color, font, spacing, or layout changes anywhere
