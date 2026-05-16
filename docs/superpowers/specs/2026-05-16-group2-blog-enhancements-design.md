# Group 2 — Blog Enhancements Design Spec

**Date:** 2026-05-16
**Scope:** Reading progress bar, TOC sticky sidebar, functional share buttons, syntax highlighting (Shiki), inline newsletter card, category/tag archive routes, RSS feed
**Stack:** TanStack Start + Vite + React 19 + Framer Motion + marked + shiki + Supabase
**Color/style:** No changes — existing tokens and classes only

---

## 1. Markdown renderer upgrade + Syntax highlighting

**New file:** `src/lib/markdown.ts`

### API

```ts
export type TocItem = { id: string; text: string; depth: 2 | 3 };

export async function parseMarkdown(
  content: string
): Promise<{ html: string; toc: TocItem[] }>;
```

### Implementation

- `marked.lexer(content)` walks tokens to extract headings at depth 2–3. Each heading's text is slugified (`text.toLowerCase().replace(/[^\w]+/g, '-')`) to produce the `id`.
- A custom `marked` code renderer calls `shiki`'s `codeToHtml(code, { lang, theme: 'github-dark' })`. Shiki uses inline styles — no extra CSS sheet required.
- Shiki highlighter is created once via `createHighlighter({ themes: ['github-dark'], langs: ['javascript','typescript','tsx','jsx','python','css','html','json','bash','sql'] })`. The instance is cached in a module-level `let highlighter` singleton, initialized lazily on first call.
- `marked.parse(content)` produces the final HTML string with highlighted code blocks and heading `id` attributes.
- Called client-side inside the `BlogPost` component (matches existing `renderMarkdown` pattern).

### Usage in `blog.$slug.tsx`

Replace `{renderMarkdown(post.content || "")}` with:

```tsx
const [{ html, toc }, setRendered] = useState({ html: "", toc: [] });

useEffect(() => {
  parseMarkdown(post.content || "").then(setRendered);
}, [post.content]);
```

The `.prose-cf` div switches to `dangerouslySetInnerHTML={{ __html: html }}`.

### Install

```bash
npm install marked shiki
npm install --save-dev @types/marked
```

---

## 2. Reading progress bar

**New file:** `src/components/site/BlogReadingProgress.tsx`

### Behavior

- Fixed position: `position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 100`
- Background: `bg-primary` (gold token — no hardcoded color)
- Scroll listener in `useEffect` on `window`:
  ```ts
  const onScroll = () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    setProgress(Math.min(100, Math.max(0, pct)));
  };
  ```
- `motion.div` from Framer Motion with `style={{ width: `${progress}%` }}` and CSS `transition: width 0.1s linear`.
- Mounted at the top of `<article>` in `BlogPost`.

---

## 3. Table of Contents (sticky sidebar)

**New file:** `src/components/site/BlogTOC.tsx`

### Props

```ts
type Props = { toc: TocItem[] };
```

Component returns `null` when `toc.length === 0`.

### Layout change in `blog.$slug.tsx`

The article inner container becomes a two-column grid on large screens:

```tsx
<div className="mt-14 lg:grid lg:grid-cols-[1fr_260px] lg:gap-12 max-w-5xl mx-auto">
  {/* left column — all prose content in one wrapper so TOC aside spans correctly */}
  <div>
    <div className="prose-cf" dangerouslySetInnerHTML={{ __html: firstHalf }} />
    <BlogNewsletterCard />
    <div className="prose-cf" dangerouslySetInnerHTML={{ __html: secondHalf }} />
  </div>
  <aside className="hidden lg:block">
    <BlogTOC toc={toc} />
  </aside>
</div>
```

### TOC component

- `sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto`
- Title: `"On this page"` in `text-xs uppercase tracking-widest text-muted-foreground`
- Links: `href={`#${item.id}`}` — smooth scroll via browser default (no JS needed)
- `h3` items: `pl-3` indentation vs `h2` at `pl-0`
- Active heading tracking via `IntersectionObserver` on all `h2`/`h3` inside the article. Active item gets `text-primary`; others `text-muted-foreground hover:text-foreground`.

### Active heading detection

```ts
useEffect(() => {
  const headings = document.querySelectorAll("article h2, article h3");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); });
    },
    { rootMargin: "0px 0px -60% 0px", threshold: 0 }
  );
  headings.forEach((h) => observer.observe(h));
  return () => observer.disconnect();
}, [toc]);
```

---

## 4. Share buttons (functional)

**File modified:** `src/routes/blog.$slug.tsx`

The existing share button row (lines 146–154) gets `onClick` handlers:

```tsx
const postUrl = `https://aiimanfolio.pro/blog/${post.slug}`;
const encodedUrl = encodeURIComponent(postUrl);
const encodedTitle = encodeURIComponent(post.title);

// Twitter
onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank')}

// LinkedIn
onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank')}

// Copy link
onClick={() => { navigator.clipboard.writeText(postUrl); toast('Link copied!'); }}
```

`toast` imported from `sonner`. No new component needed.

---

## 5. Inline newsletter card

**New file:** `src/components/site/BlogNewsletterCard.tsx`

### Supabase migration (run once in Supabase dashboard)

```sql
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now(),
  confirmed boolean default false
);
alter table newsletter_subscribers enable row level security;
create policy "anon insert" on newsletter_subscribers
  for insert to anon with check (true);
```

### Component

```tsx
type State = "idle" | "loading" | "success";
```

- Card: `.card-cf p-8 text-center` with heading `"Enjoyed this? Get more."` and subtext `"No spam. Unsubscribe any time."`
- Email `<input>` + `.btn-gold` submit button
- On submit:
  1. Set state `loading`
  2. `await supabase.from('newsletter_subscribers').insert({ email })`
  3. Any error (including duplicate unique violation) is swallowed — always transitions to `success`
  4. State `success`: replace form with `"You're in! Check your inbox."` message
- Basic client-side validation: `email.includes('@')` before submit

### Placement in `blog.$slug.tsx`

```ts
function splitContent(content: string): [string, string] {
  if (content.length < 300) return [content, ""];
  const mid = Math.floor(content.length / 2);
  const splitIdx = content.indexOf("\n\n", mid);
  if (splitIdx === -1) return [content, ""];
  return [content.slice(0, splitIdx), content.slice(splitIdx + 2)];
}
```

`parseMarkdown` called on each half separately. Between the two halves, `<BlogNewsletterCard />` is rendered.

---

## 6. Category archive route

**New file:** `src/routes/blog.category.$slug.tsx`

### Loader

```ts
const { data } = await supabase
  .from("blog_posts")
  .select("title, slug, excerpt, cover_image, category, tags, reading_time, published_at, author_name")
  .eq("status", "published")
  .eq("category", params.slug)
  .order("published_at", { ascending: false });
```

### Component

- Header: `<h1>Category: <span className="gradient-text">{params.slug}</span></h1>`
- Same `card-cf` grid layout as `blog.tsx`
- Empty state: `<Inbox>` icon + `"No articles in this category yet."`
- `head()` exports: `title: "${slug} articles — AiimanFolio.Pro"`, canonical `/blog/category/${slug}`

### Link wiring in `blog.$slug.tsx`

```tsx
// Category chip → archive link
<Link to="/blog/category/$slug" params={{ slug: post.category }} className="chip">
  {post.category}
</Link>
```

---

## 7. Tag archive route

**New file:** `src/routes/blog.tag.$slug.tsx`

### Loader

```ts
const { data } = await supabase
  .from("blog_posts")
  .select("title, slug, excerpt, cover_image, category, tags, reading_time, published_at, author_name")
  .eq("status", "published")
  .contains("tags", [params.slug])
  .order("published_at", { ascending: false });
```

### Component

- Header: `<h1>Tag: <span className="gradient-text">#{params.slug}</span></h1>`
- Same card grid as `blog.tsx`
- Empty state: `<Inbox>` + `"No articles with this tag yet."`
- `head()` exports: `title: "#${slug} articles — AiimanFolio.Pro"`, canonical `/blog/tag/${slug}`

### Link wiring in `blog.$slug.tsx`

```tsx
// Tag chips → archive links
{post.tags.map((t: string) => (
  <Link key={t} to="/blog/tag/$slug" params={{ slug: t }}
    className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground hover:text-primary transition-colors">
    #{t}
  </Link>
))}
```

---

## 8. RSS feed

**New file:** `src/routes/rss[.]xml.ts`

### Server handler

```ts
GET: async () => {
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("title, slug, excerpt, published_at, author_name, category")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const items = (posts ?? []).map((p) => `
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${BASE_URL}/blog/${p.slug}</link>
    <description><![CDATA[${p.excerpt ?? ""}]]></description>
    <pubDate>${new Date(p.published_at ?? Date.now()).toUTCString()}</pubDate>
    <author>${p.author_name ?? ""}</author>
    <category>${p.category ?? ""}</category>
    <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>
  </item>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AiimanFolio.Pro Blog</title>
    <link>${BASE_URL}</link>
    <description>Essays on design, engineering, and shipping premium products.</description>
    <language>en-us</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml", "Cache-Control": "public, max-age=3600" },
  });
}
```

`BASE_URL = "https://aiimanfolio.pro"` (same constant as sitemap).

### Discovery link in `src/routes/__root.tsx`

```ts
{ rel: "alternate", type: "application/rss+xml", title: "AiimanFolio.Pro Blog", href: "https://aiimanfolio.pro/rss.xml" }
```

Added to the root `head()` `links` array.

---

## Files changed

| File | Action |
|------|--------|
| `src/lib/markdown.ts` | Create — parseMarkdown() with marked + shiki |
| `src/components/site/BlogReadingProgress.tsx` | Create |
| `src/components/site/BlogTOC.tsx` | Create |
| `src/components/site/BlogNewsletterCard.tsx` | Create |
| `src/routes/blog.category.$slug.tsx` | Create |
| `src/routes/blog.tag.$slug.tsx` | Create |
| `src/routes/rss[.]xml.ts` | Create |
| `src/routes/blog.$slug.tsx` | Modify — wire all new features |
| `src/routes/__root.tsx` | Modify — add RSS discovery link |
| `package.json` | Modify — add marked, shiki |

No color, font, spacing, or layout token changes.

---

## Acceptance criteria

- [ ] Blog post page shows gold progress bar that fills as user scrolls
- [ ] TOC appears on lg+ screens, sticky, highlights active heading
- [ ] Share buttons open correct URLs; copy button shows toast
- [ ] Code blocks in posts render with dark syntax highlighting
- [ ] Newsletter card appears mid-article; email submits to Supabase; shows success state
- [ ] `/blog/category/[slug]` shows filtered posts grid
- [ ] `/blog/tag/[slug]` shows filtered posts grid
- [ ] Category chip and tag chips in post detail are clickable links
- [ ] `/rss.xml` returns valid RSS 2.0 XML with all published posts
- [ ] RSS discovery `<link>` tag present in page `<head>`
- [ ] `bun run build` exits 0, no type errors
- [ ] No color, font, spacing, or layout changes anywhere
