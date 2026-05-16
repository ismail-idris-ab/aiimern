# Group 2 — Blog Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reading progress bar, sticky TOC, functional share buttons, syntax highlighting, inline newsletter card, category/tag archive routes, and an RSS feed to the blog.

**Architecture:** A new `src/lib/markdown.ts` utility wraps `marked` + `shiki` and is called client-side inside `BlogPost`. Each UI feature (progress bar, TOC, newsletter card) is a focused standalone component. Two new TanStack Router file routes handle category and tag archives. The RSS feed mirrors the existing sitemap server route pattern.

**Tech Stack:** React 19, TanStack Start, marked, shiki, Framer Motion (already installed), Supabase, TypeScript strict, Bun/npm

---

## File map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/markdown.ts` | parseMarkdown() — marked + shiki, TOC extraction |
| Create | `src/components/site/BlogReadingProgress.tsx` | Scroll-driven gold progress bar |
| Create | `src/components/site/BlogTOC.tsx` | Sticky TOC sidebar with active heading tracking |
| Create | `src/components/site/BlogNewsletterCard.tsx` | Inline newsletter subscription card |
| Create | `src/routes/blog.category.$slug.tsx` | Category archive page |
| Create | `src/routes/blog.tag.$slug.tsx` | Tag archive page |
| Create | `src/routes/rss[.]xml.ts` | RSS 2.0 feed |
| Modify | `src/routes/blog.$slug.tsx` | Wire all new components, functional share buttons |
| Modify | `src/routes/__root.tsx` | Add Toaster + RSS discovery link |
| Modify | `src/integrations/supabase/types.ts` | Add newsletter_subscribers table type |

---

## Task 1: Install marked and shiki

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install packages**

```bash
npm install marked shiki
npm install --save-dev @types/marked
```

Expected: `marked` and `shiki` appear in `package.json` dependencies. No errors.

- [ ] **Step 2: Verify TypeScript can resolve them**

```bash
npm run build 2>&1 | head -30
```

Expected: build succeeds or fails only on pre-existing errors (not on import resolution for `marked` or `shiki`).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add marked and shiki"
```

---

## Task 2: Create markdown utility

**Files:**
- Create: `src/lib/markdown.ts`

- [ ] **Step 1: Create the file**

```typescript
import { marked, Marked, Renderer } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: [
        "javascript",
        "typescript",
        "tsx",
        "jsx",
        "python",
        "css",
        "html",
        "json",
        "bash",
        "sql",
      ],
    });
  }
  return highlighter;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function parseMarkdown(
  content: string,
): Promise<{ html: string; toc: TocItem[] }> {
  const hl = await getHighlighter();

  // Extract TOC from tokens using base marked (no custom renderer needed for lexing)
  const toc: TocItem[] = [];
  const tokens = marked.lexer(content);
  for (const token of tokens) {
    if (
      token.type === "heading" &&
      (token.depth === 2 || token.depth === 3)
    ) {
      toc.push({
        id: slugify(token.text),
        text: token.text,
        depth: token.depth as 2 | 3,
      });
    }
  }

  // Use Marked class to avoid mutating global marked instance
  const renderer = new Renderer();

  renderer.heading = function ({
    text,
    depth,
  }: {
    text: string;
    depth: number;
    raw: string;
  }): string {
    return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
  };

  renderer.code = function ({
    text,
    lang,
  }: {
    text: string;
    lang?: string;
    escaped?: boolean;
  }): string {
    const loadedLangs = hl.getLoadedLanguages();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const language = lang && loadedLangs.includes(lang as any) ? lang : "text";
    return hl.codeToHtml(text, { lang: language, theme: "github-dark" });
  };

  const instance = new Marked({ renderer });
  const html = instance.parse(content) as string;
  return { html, toc };
}
```

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | grep -i "markdown\|error" | head -20
```

Expected: zero errors on `src/lib/markdown.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/markdown.ts
git commit -m "feat: add markdown parser with shiki syntax highlighting"
```

---

## Task 3: Create BlogReadingProgress component

**Files:**
- Create: `src/components/site/BlogReadingProgress.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] bg-primary"
      style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/site/BlogReadingProgress.tsx
git commit -m "feat: add reading progress bar component"
```

---

## Task 4: Create BlogTOC component

**Files:**
- Create: `src/components/site/BlogTOC.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";
import type { TocItem } from "@/lib/markdown";

type Props = { toc: TocItem[] };

export function BlogTOC({ toc }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (toc.length === 0) return;
    const headings = document.querySelectorAll("article h2, article h3");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        On this page
      </p>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "pl-3" : ""}>
            <a
              href={`#${item.id}`}
              className={`text-sm transition-colors leading-snug block ${
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/site/BlogTOC.tsx
git commit -m "feat: add sticky table of contents component"
```

---

## Task 5: Add newsletter_subscribers type + create BlogNewsletterCard

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Create: `src/components/site/BlogNewsletterCard.tsx`

**Prerequisites — run this SQL in the Supabase dashboard (SQL Editor) before starting:**

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

- [ ] **Step 1: Add newsletter_subscribers to the types file**

In `src/integrations/supabase/types.ts`, find the `contact_messages` block (around line 80) and add the new table entry **before** the closing `}` of `Tables`. The insertion point is after `contact_messages`'s `Relationships: []` closing brace and before the `}` that closes `Tables:`.

Add this block:

```typescript
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          confirmed: boolean
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          confirmed?: boolean
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          confirmed?: boolean
        }
        Relationships: []
      }
```

The result should look like:

```typescript
    Tables: {
      blog_posts: { ... }
      contact_messages: {
        ...
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          confirmed: boolean
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          confirmed?: boolean
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          confirmed?: boolean
        }
        Relationships: []
      }
    }
```

- [ ] **Step 2: Create BlogNewsletterCard.tsx**

```tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = "idle" | "loading" | "success";

export function BlogNewsletterCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    await supabase.from("newsletter_subscribers").insert({ email });
    setState("success");
  };

  if (state === "success") {
    return (
      <div className="card-cf p-8 text-center my-12">
        <p className="text-lg font-semibold gradient-text">You're in!</p>
        <p className="text-sm text-muted-foreground mt-1">
          More essays coming your way.
        </p>
      </div>
    );
  }

  return (
    <div className="card-cf p-8 text-center my-12">
      <h3 className="text-xl font-display font-semibold">Enjoyed this?</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Get more essays on design and engineering. No spam. Unsubscribe any
        time.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 max-w-sm mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 bg-surface-soft border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-gold"
        >
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Lint**

```bash
npm run lint 2>&1 | grep -i "newsletter\|error" | head -20
```

Expected: zero errors on both files.

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts src/components/site/BlogNewsletterCard.tsx
git commit -m "feat: add newsletter subscription card and Supabase type"
```

---

## Task 6: Rewrite blog.$slug.tsx

**Files:**
- Modify: `src/routes/blog.$slug.tsx`

This is the main integration task. Replace the entire file with the version below, which wires all new components, makes share buttons functional, and converts rendering to `parseMarkdown`.

- [ ] **Step 1: Replace the entire file**

```tsx
import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Twitter,
  Linkedin,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BlogReadingProgress } from "@/components/site/BlogReadingProgress";
import { BlogTOC } from "@/components/site/BlogTOC";
import { BlogNewsletterCard } from "@/components/site/BlogNewsletterCard";
import { parseMarkdown } from "@/lib/markdown";
import type { TocItem } from "@/lib/markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();

    const { data: related } = await supabase
      .from("blog_posts")
      .select("title, slug, cover_image, category, reading_time")
      .eq("status", "published")
      .neq("slug", params.slug)
      .limit(3);

    return { post: data, related: related ?? [] };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const title = post?.seo_title || post?.title || "Article";
    const desc = (
      post?.seo_description ||
      post?.excerpt ||
      "Read the latest essay on design, engineering, and shipping premium products."
    ).slice(0, 200);
    const image = post?.cover_image || "/og-default.jpg";
    const url = `/blog/${params.slug}`;
    return {
      meta: [
        { title: `${title} — AiimanFolio.Pro` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "640" },
        { property: "og:image:alt", content: title },
        ...(post?.published_at
          ? [{ property: "article:published_time", content: post.published_at }]
          : []),
        ...(post?.author_name
          ? [{ property: "article:author", content: post.author_name }]
          : []),
        ...(post?.category
          ? [{ property: "article:section", content: post.category }]
          : []),
        ...((post?.tags ?? []).map((tag: string) => ({
          property: "article:tag",
          content: tag,
        }))),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: post.title,
                description: post.excerpt,
                image: image,
                datePublished: post.published_at,
                dateModified: post.published_at,
                author: { "@type": "Person", name: post.author_name },
                mainEntityOfPage: { "@type": "WebPage", "@id": url },
              }),
            },
          ]
        : [],
    };
  },
  component: BlogPost,
  errorComponent: ({ error }) => (
    <>
      <Navbar />
      <div className="container-cf pt-36 pb-20 text-center">
        <h1 className="text-3xl font-display font-semibold">
          Couldn't load article
        </h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Link to="/blog" className="btn-ghost mt-6 inline-flex">
          Back to blog
        </Link>
      </div>
      <Footer />
    </>
  ),
  notFoundComponent: () => (
    <>
      <Navbar />
      <div className="container-cf pt-36 pb-20 text-center">
        <h1 className="text-5xl font-display font-semibold gold-text">404</h1>
        <p className="text-muted-foreground mt-2">Article not found.</p>
        <Link to="/blog" className="btn-gold mt-6 inline-flex">
          Back to blog
        </Link>
      </div>
      <Footer />
    </>
  ),
});

function splitContent(content: string): [string, string] {
  if (content.length < 300) return [content, ""];
  const mid = Math.floor(content.length / 2);
  const splitIdx = content.indexOf("\n\n", mid);
  if (splitIdx === -1) return [content, ""];
  return [content.slice(0, splitIdx), content.slice(splitIdx + 2)];
}

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const [firstHtml, setFirstHtml] = useState("");
  const [secondHtml, setSecondHtml] = useState("");
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    const [first, second] = splitContent(post.content || "");
    Promise.all([
      parseMarkdown(first),
      second
        ? parseMarkdown(second)
        : Promise.resolve({ html: "", toc: [] as TocItem[] }),
    ]).then(([a, b]) => {
      setFirstHtml(a.html);
      setSecondHtml(b.html);
      setToc([...a.toc, ...b.toc]);
    });
  }, [post.content]);

  const postUrl = `https://aiimanfolio.pro/blog/${post.slug}`;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post.title);

  return (
    <>
      <Navbar />
      <BlogReadingProgress />
      <main>
        <article className="pt-32">
          <div className="container-cf max-w-4xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={14} /> All articles
            </Link>

            <header className="mt-8 text-center max-w-3xl mx-auto">
              <Link
                to="/blog/category/$slug"
                params={{ slug: post.category }}
                className="chip"
              >
                {post.category}
              </Link>
              <h1 className="mt-5 text-4xl md:text-6xl font-display font-semibold leading-[1.1]">
                {post.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>
              <div className="mt-6 flex items-center justify-center gap-5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {post.author_name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  {post.published_at &&
                    new Date(post.published_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.reading_time} min read
                </span>
              </div>
            </header>

            <div className="mt-12 aspect-[16/9] rounded-3xl overflow-hidden border border-[var(--border)]">
              <img
                src={post.cover_image || "/og-default.jpg"}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="container-cf mt-14">
            <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-12 max-w-5xl mx-auto">
              <div>
                <div
                  className="prose-cf"
                  dangerouslySetInnerHTML={{ __html: firstHtml }}
                />
                <BlogNewsletterCard />
                <div
                  className="prose-cf"
                  dangerouslySetInnerHTML={{ __html: secondHtml }}
                />
              </div>
              <aside className="hidden lg:block">
                <BlogTOC toc={toc} />
              </aside>
            </div>
          </div>

          <div className="container-cf">
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 max-w-5xl mx-auto flex flex-wrap gap-2">
                {post.tags.map((t: string) => (
                  <Link
                    key={t}
                    to="/blog/tag/$slug"
                    params={{ slug: t }}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface-soft text-muted-foreground hover:text-primary transition-colors"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 max-w-5xl mx-auto pt-8 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Share this article
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
                      "_blank",
                    )
                  }
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Twitter size={15} />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                      "_blank",
                    )
                  }
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Linkedin size={15} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(postUrl);
                    toast("Link copied!");
                  }}
                  className="grid place-items-center size-10 rounded-xl border border-[var(--border)] text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <LinkIcon size={15} />
                </button>
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section-pad">
            <div className="container-cf">
              <h2 className="text-3xl font-display font-semibold mb-8">
                Related articles
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map(
                  (r: {
                    slug: string;
                    title: string;
                    cover_image: string | null;
                    category: string;
                    reading_time: number;
                  }) => (
                    <Link
                      key={r.slug}
                      to="/blog/$slug"
                      params={{ slug: r.slug }}
                      className="card-cf p-4 group"
                    >
                      <div className="aspect-[16/10] rounded-xl overflow-hidden">
                        <img
                          src={r.cover_image || "/og-default.jpg"}
                          alt={r.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <span className="chip !py-1 !px-2.5 !text-[11px]">
                          {r.category}
                        </span>
                        <h3 className="mt-3 font-semibold group-hover:text-primary transition-colors">
                          {r.title}
                        </h3>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | grep -i "blog\.\$slug\|error" | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/blog.$slug.tsx
git commit -m "feat: wire progress bar, TOC, newsletter, share buttons, syntax highlighting"
```

---

## Task 7: Create category archive route

**Files:**
- Create: `src/routes/blog.category.$slug.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Inbox } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, cover_image, category, reading_time, published_at",
      )
      .eq("status", "published")
      .eq("category", params.slug)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return { posts: data ?? [], slug: params.slug };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} articles — AiimanFolio.Pro` },
      {
        name: "description",
        content: `All articles in the ${params.slug} category.`,
      },
    ],
    links: [{ rel: "canonical", href: `/blog/category/${params.slug}` }],
  }),
  component: CategoryArchive,
});

function CategoryArchive() {
  const { posts, slug } = Route.useLoaderData();

  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-12">
          <div className="container-cf max-w-3xl text-center">
            <span className="chip">Category</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-display font-semibold leading-tight">
              <span className="gradient-text">{slug}</span>
            </h1>
          </div>
        </section>

        <section className="container-cf pb-20">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <Inbox className="mx-auto text-muted-foreground mb-4" size={32} />
              <p className="text-muted-foreground">
                No articles in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="card-cf p-4 group"
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden">
                    <img
                      src={post.cover_image || "/og-default.jpg"}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="chip !py-1 !px-2.5 !text-[11px]">
                        {post.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {post.reading_time} min
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add 'src/routes/blog.category.$slug.tsx'
git commit -m "feat: add category archive route"
```

---

## Task 8: Create tag archive route

**Files:**
- Create: `src/routes/blog.tag.$slug.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Inbox } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog/tag/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, cover_image, category, reading_time, published_at",
      )
      .eq("status", "published")
      .contains("tags", [params.slug])
      .order("published_at", { ascending: false });
    if (error) throw error;
    return { posts: data ?? [], slug: params.slug };
  },
  head: ({ params }) => ({
    meta: [
      { title: `#${params.slug} articles — AiimanFolio.Pro` },
      {
        name: "description",
        content: `All articles tagged with #${params.slug}.`,
      },
    ],
    links: [{ rel: "canonical", href: `/blog/tag/${params.slug}` }],
  }),
  component: TagArchive,
});

function TagArchive() {
  const { posts, slug } = Route.useLoaderData();

  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-12">
          <div className="container-cf max-w-3xl text-center">
            <span className="chip">Tag</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-display font-semibold leading-tight">
              <span className="gradient-text">#{slug}</span>
            </h1>
          </div>
        </section>

        <section className="container-cf pb-20">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <Inbox className="mx-auto text-muted-foreground mb-4" size={32} />
              <p className="text-muted-foreground">
                No articles with this tag yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="card-cf p-4 group"
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden">
                    <img
                      src={post.cover_image || "/og-default.jpg"}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="chip !py-1 !px-2.5 !text-[11px]">
                        {post.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {post.reading_time} min
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add 'src/routes/blog.tag.$slug.tsx'
git commit -m "feat: add tag archive route"
```

---

## Task 9: Create RSS feed route

**Files:**
- Create: `src/routes/rss[.]xml.ts`

- [ ] **Step 1: Create the file**

```typescript
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://aiimanfolio.pro";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("blog_posts")
          .select("title, slug, excerpt, published_at, author_name, category")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        const items = (posts ?? [])
          .map(
            (p) =>
              `  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${BASE_URL}/blog/${p.slug}</link>
    <description><![CDATA[${p.excerpt ?? ""}]]></description>
    <pubDate>${new Date(p.published_at ?? Date.now()).toUTCString()}</pubDate>
    <author>${p.author_name ?? ""}</author>
    <category>${p.category ?? ""}</category>
    <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>
  </item>`,
          )
          .join("\n");

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
          headers: {
            "Content-Type": "application/rss+xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add "src/routes/rss[.]xml.ts"
git commit -m "feat: add RSS 2.0 feed route"
```

---

## Task 10: Update __root.tsx — Toaster + RSS discovery link

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Add `Toaster` import and mount it**

At the top of `src/routes/__root.tsx`, add the import:

```typescript
import { Toaster } from "@/components/ui/sonner";
```

In `RootComponent`, mount it inside the `QueryClientProvider`:

```tsx
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Add RSS discovery link to head()**

In the `head()` return value, add to the `links` array:

```typescript
{
  rel: "alternate",
  type: "application/rss+xml",
  title: "AiimanFolio.Pro Blog",
  href: "https://aiimanfolio.pro/rss.xml",
},
```

The full `links` array should become:

```typescript
links: [
  { rel: "stylesheet", href: appCss },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
  {
    rel: "alternate",
    type: "application/rss+xml",
    title: "AiimanFolio.Pro Blog",
    href: "https://aiimanfolio.pro/rss.xml",
  },
],
```

- [ ] **Step 3: Lint**

```bash
npm run lint 2>&1 | grep -i "__root\|error" | head -20
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: add Toaster and RSS discovery link to root"
```

---

## Task 11: Production build verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors, no Vite warnings about missing modules.

- [ ] **Step 2: Smoke test dev server**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- Navigate to any blog post — gold progress bar appears at top and grows as you scroll
- TOC appears on right side on wide screen (lg+)
- TOC active item highlights as you scroll through headings
- Code blocks in posts render with dark syntax highlighting (if post has code)
- Newsletter card appears mid-article
- Newsletter email submit shows success state
- Twitter/LinkedIn share buttons open correct URLs in new tab
- Copy link button shows "Link copied!" toast
- Category chip navigates to `/blog/category/[name]` — renders filtered grid
- Tag chips navigate to `/blog/tag/[name]` — renders filtered grid
- `http://localhost:5173/rss.xml` returns valid RSS XML
- Page `<head>` contains `<link rel="alternate" type="application/rss+xml" ...>`

- [ ] **Step 3: Final commit if any stragglers**

```bash
git status
```

If clean, nothing to commit. If stragglers, add and commit with `chore: group2 cleanup`.
