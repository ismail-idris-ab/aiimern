# Group 4 — Admin CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a protected admin dashboard at `/admin` for full CRUD management of blog posts and projects, gated by Supabase Auth email/password login.

**Architecture:** TanStack Router flat file routes all nested under `admin.tsx` layout; `beforeLoad` guards redirect unauthenticated users to `/admin/login`; server functions use `supabaseAdmin` + token validation for all mutations; cover images upload to Supabase Storage `covers` bucket.

**Tech Stack:** TanStack Router v1 (flat file routing), TanStack Start `createServerFn`, Supabase Auth + Storage + supabaseAdmin, Zod, React state (no react-hook-form), existing design tokens only.

---

## File Map

**New files:**
```
src/lib/upload-cover.ts                    ← client-side Supabase Storage upload helper
src/lib/admin-blog-actions.ts              ← upsertPost, deletePost, getPostById server fns
src/lib/admin-project-actions.ts           ← upsertProject, deleteProject, getProjectById server fns
src/components/admin/PostForm.tsx          ← shared blog post form (new + edit)
src/components/admin/ProjectForm.tsx       ← shared project form (new + edit)
src/routes/admin.tsx                       ← admin layout + auth guard
src/routes/admin.index.tsx                 ← redirect /admin → /admin/blog
src/routes/admin.login.tsx                 ← login page
src/routes/admin.blog.tsx                  ← blog posts list
src/routes/admin.blog_.new.tsx             ← new post page
src/routes/admin.blog_.$id.edit.tsx        ← edit post page
src/routes/admin.projects.tsx              ← projects list
src/routes/admin.projects_.new.tsx         ← new project page
src/routes/admin.projects_.$id.edit.tsx    ← edit project page
```

**Modified files:**
```
src/styles.css                             ← add .cf-input to @layer components
src/components/site/ContactSection.tsx     ← remove inline <style> block (now in styles.css)
src/routeTree.gen.ts                       ← auto-regenerated (bun run dev triggers it)
```

**Naming note:** Trailing underscore in flat filenames (`blog_`, `projects_`) breaks layout inheritance — new/edit pages won't nest inside `admin.blog.tsx`/`admin.projects.tsx`. They remain children of `admin.tsx` (sidebar layout). The actual browser URL has no underscore: `admin.blog_.new.tsx` → URL `/admin/blog/new`.

---

## Task 1: Move `.cf-input` to `src/styles.css`

**Files:**
- Modify: `src/styles.css`
- Modify: `src/components/site/ContactSection.tsx`

- [ ] **Step 1: Add `.cf-input` to `src/styles.css`**

Open `src/styles.css`. After the `.prose-cf` block (around line 238, before the closing `}`  of `@layer components`), add:

```css
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
  .cf-input:focus {
    outline: none;
    border-color: var(--primary);
    background: color-mix(in oklab, var(--primary) 5%, var(--surface-soft));
  }
```

- [ ] **Step 2: Remove inline `<style>` from `ContactSection.tsx`**

In `src/components/site/ContactSection.tsx`, delete the entire `<style>` JSX block (lines 112–125):

```tsx
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
```

The `.cf-input` class still works — it's now in the global stylesheet.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css src/components/site/ContactSection.tsx
git commit -m "refactor: move cf-input to global styles"
```

---

## Task 2: Image Upload Helper

**Files:**
- Create: `src/lib/upload-cover.ts`

- [ ] **Step 1: Create `src/lib/upload-cover.ts`**

```ts
import { supabase } from "@/integrations/supabase/client";

export async function uploadCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}
```

**Prerequisite:** A public bucket named `covers` must exist in the Supabase Storage dashboard before this works. The build will succeed without it; uploads will fail at runtime until created.

- [ ] **Step 2: Commit**

```bash
git add src/lib/upload-cover.ts
git commit -m "feat: add Supabase Storage cover upload helper"
```

---

## Task 3: Blog Server Actions

**Files:**
- Create: `src/lib/admin-blog-actions.ts`

- [ ] **Step 1: Create `src/lib/admin-blog-actions.ts`**

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function validateToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

const postSchema = z.object({
  token: z.string(),
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().default(""),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  cover_image: z.string().nullable().default(null),
  status: z.enum(["draft", "published"]).default("draft"),
  content: z.string().default(""),
  author_name: z.string().default("Aiiman"),
  reading_time: z.number().int().min(1).default(5),
  featured: z.boolean().default(false),
  seo_title: z.string().nullable().default(null),
  seo_description: z.string().nullable().default(null),
  og_image: z.string().nullable().default(null),
});

export const upsertPost = createServerFn({ method: "POST" })
  .inputValidator(postSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { token, id, ...fields } = data;
    const now = new Date().toISOString();
    const payload = { ...fields, updated_at: now };

    if (id) {
      const { error } = await supabaseAdmin.from("blog_posts").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("blog_posts").insert({
        ...payload,
        ...(fields.status === "published" ? { published_at: now } : {}),
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const deleteSchema = z.object({ token: z.string(), id: z.string() });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator(deleteSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const getByIdSchema = z.object({ token: z.string(), id: z.string() });

export const getPostById = createServerFn({ method: "POST" })
  .inputValidator(getByIdSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return post;
  });
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin-blog-actions.ts
git commit -m "feat: add admin blog server actions (upsert, delete, getById)"
```

---

## Task 4: Project Server Actions

**Files:**
- Create: `src/lib/admin-project-actions.ts`

- [ ] **Step 1: Create `src/lib/admin-project-actions.ts`**

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function validateToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

const projectSchema = z.object({
  token: z.string(),
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable().default(null),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  cover_image: z.string().nullable().default(null),
  live_url: z.string().nullable().default(null),
  github_url: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  status: z.string().default("draft"),
  content: z.string().nullable().default(null),
});

export const upsertProject = createServerFn({ method: "POST" })
  .inputValidator(projectSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { token, id, ...fields } = data;

    if (id) {
      const { error } = await supabaseAdmin.from("projects").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("projects").insert(fields);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const deleteSchema = z.object({ token: z.string(), id: z.string() });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator(deleteSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const getByIdSchema = z.object({ token: z.string(), id: z.string() });

export const getProjectById = createServerFn({ method: "POST" })
  .inputValidator(getByIdSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return project;
  });
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin-project-actions.ts
git commit -m "feat: add admin project server actions (upsert, delete, getById)"
```

---

## Task 5: PostForm Component

**Files:**
- Create: `src/components/admin/PostForm.tsx`

- [ ] **Step 1: Create `src/components/admin/PostForm.tsx`**

```tsx
import { useState, useEffect, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { parseMarkdown } from "@/lib/markdown";
import { uploadCover } from "@/lib/upload-cover";
import { upsertPost } from "@/lib/admin-blog-actions";
import { supabase } from "@/integrations/supabase/client";

type Values = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  cover_image: string;
  status: "draft" | "published";
  content: string;
  author_name: string;
  reading_time: number;
  featured: boolean;
};

const DEFAULTS: Values = {
  title: "", slug: "", excerpt: "", category: "", tags: "",
  cover_image: "", status: "draft", content: "",
  author_name: "Aiiman", reading_time: 5, featured: false,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function PostForm({
  initialValues,
  postId,
  onSaved,
}: {
  initialValues?: Partial<Values>;
  postId?: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Values>({ ...DEFAULTS, ...initialValues });
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (values.content) {
        parseMarkdown(values.content).then(({ html }) => setPreview(html));
      } else {
        setPreview("");
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [values.content]);

  const set =
    (key: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleTitleBlur = () => {
    if (!values.slug) setValues((v) => ({ ...v, slug: slugify(v.title) }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCover(file);
      setValues((v) => ({ ...v, cover_image: url }));
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated.");
        return;
      }
      await upsertPost({
        data: {
          token: session.access_token,
          ...(postId ? { id: postId } : {}),
          title: values.title,
          slug: values.slug,
          excerpt: values.excerpt,
          category: values.category,
          tags: values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          cover_image: values.cover_image || null,
          status: values.status,
          content: values.content,
          author_name: values.author_name,
          reading_time: values.reading_time,
          featured: values.featured,
          seo_title: null,
          seo_description: null,
          og_image: null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Title</span>
          <input
            className="cf-input mt-2"
            value={values.title}
            onChange={set("title")}
            onBlur={handleTitleBlur}
            placeholder="Post title"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Slug</span>
          <input
            className="cf-input mt-2"
            value={values.slug}
            onChange={set("slug")}
            placeholder="post-slug"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Excerpt</span>
        <textarea
          className="cf-input mt-2 resize-none"
          rows={3}
          value={values.excerpt}
          onChange={set("excerpt")}
          placeholder="Short description…"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Category</span>
          <input className="cf-input mt-2" value={values.category} onChange={set("category")} placeholder="Engineering" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</span>
          <input className="cf-input mt-2" value={values.tags} onChange={set("tags")} placeholder="react, typescript" />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Author</span>
          <input className="cf-input mt-2" value={values.author_name} onChange={set("author_name")} required />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Read time (min)</span>
          <input
            className="cf-input mt-2"
            type="number"
            min={1}
            value={values.reading_time}
            onChange={(e) => setValues((v) => ({ ...v, reading_time: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>
          <select
            className="cf-input mt-2"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as "draft" | "published" }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Cover Image</span>
        <div className="mt-2 flex gap-2">
          <input
            className="cf-input flex-1"
            value={values.cover_image}
            onChange={set("cover_image")}
            placeholder="https://… or upload →"
          />
          <label className="btn-ghost cursor-pointer shrink-0 flex items-center gap-2">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.featured}
          onChange={(e) => setValues((v) => ({ ...v, featured: e.target.checked }))}
        />
        <span className="text-sm">Featured post</span>
      </label>

      <div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Content (Markdown)</span>
        <div className="mt-2 grid lg:grid-cols-2 gap-4 min-h-96">
          <textarea
            className="cf-input h-96 lg:h-auto resize-none font-mono text-sm"
            value={values.content}
            onChange={set("content")}
            placeholder={"# Heading\n\nWrite your post…"}
          />
          <div className="card-cf p-4 overflow-auto h-96 lg:h-auto">
            {preview ? (
              <div className="prose-cf" dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <p className="text-muted-foreground text-sm italic">Preview appears here…</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button type="submit" disabled={saving || uploading} className="btn-gold disabled:opacity-60">
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving…
          </>
        ) : (
          "Save post"
        )}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PostForm.tsx
git commit -m "feat: add admin PostForm component with markdown preview"
```

---

## Task 6: ProjectForm Component

**Files:**
- Create: `src/components/admin/ProjectForm.tsx`

- [ ] **Step 1: Create `src/components/admin/ProjectForm.tsx`**

```tsx
import { useState, useEffect, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { parseMarkdown } from "@/lib/markdown";
import { uploadCover } from "@/lib/upload-cover";
import { upsertProject } from "@/lib/admin-project-actions";
import { supabase } from "@/integrations/supabase/client";

type Values = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  cover_image: string;
  live_url: string;
  github_url: string;
  featured: boolean;
  sort_order: number;
  status: string;
  content: string;
};

const DEFAULTS: Values = {
  title: "", slug: "", excerpt: "", category: "", tags: "",
  cover_image: "", live_url: "", github_url: "",
  featured: false, sort_order: 0, status: "draft", content: "",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProjectForm({
  initialValues,
  projectId,
  onSaved,
}: {
  initialValues?: Partial<Values>;
  projectId?: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Values>({ ...DEFAULTS, ...initialValues });
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (values.content) {
        parseMarkdown(values.content).then(({ html }) => setPreview(html));
      } else {
        setPreview("");
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [values.content]);

  const set =
    (key: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleTitleBlur = () => {
    if (!values.slug) setValues((v) => ({ ...v, slug: slugify(v.title) }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCover(file);
      setValues((v) => ({ ...v, cover_image: url }));
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated.");
        return;
      }
      await upsertProject({
        data: {
          token: session.access_token,
          ...(projectId ? { id: projectId } : {}),
          title: values.title,
          slug: values.slug,
          excerpt: values.excerpt || null,
          category: values.category,
          tags: values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          cover_image: values.cover_image || null,
          live_url: values.live_url || null,
          github_url: values.github_url || null,
          featured: values.featured,
          sort_order: values.sort_order,
          status: values.status,
          content: values.content || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Title</span>
          <input
            className="cf-input mt-2"
            value={values.title}
            onChange={set("title")}
            onBlur={handleTitleBlur}
            placeholder="Project title"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Slug</span>
          <input className="cf-input mt-2" value={values.slug} onChange={set("slug")} placeholder="project-slug" required />
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Excerpt</span>
        <textarea
          className="cf-input mt-2 resize-none"
          rows={3}
          value={values.excerpt}
          onChange={set("excerpt")}
          placeholder="Short project description…"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Category</span>
          <input className="cf-input mt-2" value={values.category} onChange={set("category")} placeholder="Web App" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</span>
          <input className="cf-input mt-2" value={values.tags} onChange={set("tags")} placeholder="react, supabase" />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Live URL</span>
          <input className="cf-input mt-2" value={values.live_url} onChange={set("live_url")} placeholder="https://…" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">GitHub URL</span>
          <input className="cf-input mt-2" value={values.github_url} onChange={set("github_url")} placeholder="https://github.com/…" />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Sort Order</span>
          <input
            className="cf-input mt-2"
            type="number"
            min={0}
            value={values.sort_order}
            onChange={(e) => setValues((v) => ({ ...v, sort_order: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>
          <select className="cf-input mt-2" value={values.status} onChange={set("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={values.featured}
              onChange={(e) => setValues((v) => ({ ...v, featured: e.target.checked }))}
            />
            <span className="text-sm">Featured</span>
          </label>
        </div>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Cover Image</span>
        <div className="mt-2 flex gap-2">
          <input
            className="cf-input flex-1"
            value={values.cover_image}
            onChange={set("cover_image")}
            placeholder="https://… or upload →"
          />
          <label className="btn-ghost cursor-pointer shrink-0 flex items-center gap-2">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </label>

      <div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Case Study (Markdown)</span>
        <div className="mt-2 grid lg:grid-cols-2 gap-4 min-h-96">
          <textarea
            className="cf-input h-96 lg:h-auto resize-none font-mono text-sm"
            value={values.content}
            onChange={set("content")}
            placeholder={"## Overview\n\nDescribe the project…"}
          />
          <div className="card-cf p-4 overflow-auto h-96 lg:h-auto">
            {preview ? (
              <div className="prose-cf" dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <p className="text-muted-foreground text-sm italic">Preview appears here…</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button type="submit" disabled={saving || uploading} className="btn-gold disabled:opacity-60">
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving…
          </>
        ) : (
          "Save project"
        )}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ProjectForm.tsx
git commit -m "feat: add admin ProjectForm component with markdown preview"
```

---

## Task 7: Admin Layout + Login + Index Routes

**Files:**
- Create: `src/routes/admin.tsx`
- Create: `src/routes/admin.index.tsx`
- Create: `src/routes/admin.login.tsx`

- [ ] **Step 1: Create `src/routes/admin.tsx`**

```tsx
import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { BookOpen, FolderOpen, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    if (location.pathname === "/admin/login") return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const location = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();
  const isLogin = location.pathname === "/admin/login";

  if (isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Outlet />
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const navLinks = [
    { to: "/admin/blog", label: "Blog Posts", Icon: BookOpen },
    { to: "/admin/projects", label: "Projects", Icon: FolderOpen },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-display text-lg font-semibold">AiimanFolio</span>
          <span className="chip ml-2" style={{ fontSize: "10px", padding: "2px 8px" }}>
            Admin
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "text-primary bg-primary/5 border-l-2 border-primary pl-2.5"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-soft"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={handleSignOut} className="btn-ghost w-full !justify-start gap-3">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/routes/admin.index.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  loader: () => {
    throw redirect({ to: "/admin/blog" });
  },
  component: () => null,
});
```

- [ ] **Step 3: Create `src/routes/admin.login.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    navigate({ to: "/admin/blog" });
  };

  return (
    <div className="card-cf p-8 w-full max-w-sm mx-4">
      <h1 className="text-2xl font-display font-semibold mb-6">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
          <input
            type="email"
            className="cf-input mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
          <input
            type="password"
            className="cf-input mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin.tsx src/routes/admin.index.tsx src/routes/admin.login.tsx
git commit -m "feat: add admin layout, login page, and index redirect"
```

---

## Task 8: Blog Admin Routes

**Files:**
- Create: `src/routes/admin.blog.tsx`
- Create: `src/routes/admin.blog_.new.tsx`
- Create: `src/routes/admin.blog_.$id.edit.tsx`

- [ ] **Step 1: Create `src/routes/admin.blog.tsx`**

```tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deletePost } from "@/lib/admin-blog-actions";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlogList,
});

type PostRow = { id: string; title: string; status: string; created_at: string };

function AdminBlogList() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await deletePost({ data: { token: session.access_token, id } });
    setConfirming(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-semibold">Blog Posts</h1>
        <Link to="/admin/blog_/new" className="btn-gold">
          <Plus size={16} /> New post
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="card-cf p-12 text-center text-muted-foreground">
          No posts yet. Create your first one.
        </div>
      ) : (
        <div className="card-cf overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-widest text-muted-foreground"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-surface-soft/50 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4">
                    <span
                      className="chip"
                      style={
                        p.status === "published"
                          ? { background: "rgba(74,222,128,0.1)", color: "#4ade80", borderColor: "rgba(74,222,128,0.2)" }
                          : {}
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/blog_/$id/edit"
                        params={{ id: p.id }}
                        className="btn-ghost !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      {confirming === p.id ? (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn-ghost !py-1.5 !px-3 !text-xs"
                          style={{ color: "var(--destructive)", borderColor: "rgba(239,68,68,0.3)" }}
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirming(p.id)}
                          className="btn-ghost !py-1.5 !px-3 !text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/routes/admin.blog_.new.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PostForm } from "@/components/admin/PostForm";

export const Route = createFileRoute("/admin/blog_/new")({
  component: AdminBlogNew,
});

function AdminBlogNew() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-3xl font-display font-semibold mb-8">New Blog Post</h1>
      <div className="card-cf p-8">
        <PostForm onSaved={() => navigate({ to: "/admin/blog" })} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/routes/admin.blog_.$id.edit.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PostForm } from "@/components/admin/PostForm";
import { getPostById } from "@/lib/admin-blog-actions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/blog_/$id/edit")({
  component: AdminBlogEdit,
});

function AdminBlogEdit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) { setError("Not authenticated."); setLoading(false); return; }
      try {
        const data = await getPostById({ data: { token: session.access_token, id } });
        setPost(data as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !post) return <p className="text-destructive">{error ?? "Post not found."}</p>;

  const initialValues = {
    title: String(post.title ?? ""),
    slug: String(post.slug ?? ""),
    excerpt: String(post.excerpt ?? ""),
    category: String(post.category ?? ""),
    tags: ((post.tags as string[]) ?? []).join(", "),
    cover_image: String(post.cover_image ?? ""),
    status: (post.status as "draft" | "published") ?? "draft",
    content: String(post.content ?? ""),
    author_name: String(post.author_name ?? "Aiiman"),
    reading_time: Number(post.reading_time ?? 5),
    featured: Boolean(post.featured),
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold mb-8">Edit Post</h1>
      <div className="card-cf p-8">
        <PostForm
          initialValues={initialValues}
          postId={id}
          onSaved={() => navigate({ to: "/admin/blog" })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin.blog.tsx src/routes/admin.blog_.new.tsx src/routes/admin.blog_.$id.edit.tsx
git commit -m "feat: add admin blog list, new, and edit routes"
```

---

## Task 9: Projects Admin Routes

**Files:**
- Create: `src/routes/admin.projects.tsx`
- Create: `src/routes/admin.projects_.new.tsx`
- Create: `src/routes/admin.projects_.$id.edit.tsx`

- [ ] **Step 1: Create `src/routes/admin.projects.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteProject } from "@/lib/admin-project-actions";

export const Route = createFileRoute("/admin/projects")({
  component: AdminProjectList,
});

type ProjectRow = { id: string; title: string; category: string; status: string; sort_order: number };

function AdminProjectList() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id, title, category, status, sort_order")
      .order("sort_order", { ascending: true });
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await deleteProject({ data: { token: session.access_token, id } });
    setConfirming(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-semibold">Projects</h1>
        <Link to="/admin/projects_/new" className="btn-gold">
          <Plus size={16} /> New project
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card-cf p-12 text-center text-muted-foreground">
          No projects yet. Create your first one.
        </div>
      ) : (
        <div className="card-cf overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-widest text-muted-foreground"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Order</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-surface-soft/50 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 text-muted-foreground">{p.category}</td>
                  <td className="p-4">
                    <span
                      className="chip"
                      style={
                        p.status === "published"
                          ? { background: "rgba(74,222,128,0.1)", color: "#4ade80", borderColor: "rgba(74,222,128,0.2)" }
                          : {}
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.sort_order}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/projects_/$id/edit"
                        params={{ id: p.id }}
                        className="btn-ghost !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      {confirming === p.id ? (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn-ghost !py-1.5 !px-3 !text-xs"
                          style={{ color: "var(--destructive)", borderColor: "rgba(239,68,68,0.3)" }}
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirming(p.id)}
                          className="btn-ghost !py-1.5 !px-3 !text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/routes/admin.projects_.new.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const Route = createFileRoute("/admin/projects_/new")({
  component: AdminProjectNew,
});

function AdminProjectNew() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-3xl font-display font-semibold mb-8">New Project</h1>
      <div className="card-cf p-8">
        <ProjectForm onSaved={() => navigate({ to: "/admin/projects" })} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/routes/admin.projects_.$id.edit.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProjectById } from "@/lib/admin-project-actions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/projects_/$id/edit")({
  component: AdminProjectEdit,
});

function AdminProjectEdit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) { setError("Not authenticated."); setLoading(false); return; }
      try {
        const data = await getProjectById({ data: { token: session.access_token, id } });
        setProject(data as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error || !project) return <p className="text-destructive">{error ?? "Project not found."}</p>;

  const initialValues = {
    title: String(project.title ?? ""),
    slug: String(project.slug ?? ""),
    excerpt: String(project.excerpt ?? ""),
    category: String(project.category ?? ""),
    tags: ((project.tags as string[]) ?? []).join(", "),
    cover_image: String(project.cover_image ?? ""),
    live_url: String(project.live_url ?? ""),
    github_url: String(project.github_url ?? ""),
    featured: Boolean(project.featured),
    sort_order: Number(project.sort_order ?? 0),
    status: String(project.status ?? "draft"),
    content: String(project.content ?? ""),
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold mb-8">Edit Project</h1>
      <div className="card-cf p-8">
        <ProjectForm
          initialValues={initialValues}
          projectId={id}
          onSaved={() => navigate({ to: "/admin/projects" })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin.projects.tsx src/routes/admin.projects_.new.tsx src/routes/admin.projects_.$id.edit.tsx
git commit -m "feat: add admin projects list, new, and edit routes"
```

---

## Task 10: Route Tree Regeneration + Build Verification

**Files:**
- Modify: `src/routeTree.gen.ts` (auto-generated)

- [ ] **Step 1: Regenerate route tree**

Start the dev server briefly to trigger route tree regeneration (TanStack Router watches routes and auto-regenerates `routeTree.gen.ts`):

```bash
bun run dev
```

Wait for the message `✓ Generated route tree` in the terminal output. Then stop the server (`Ctrl+C`). Verify `src/routeTree.gen.ts` now includes references to `AdminRoute`, `AdminLoginRoute`, `AdminBlogRoute`, `AdminProjectsRoute`, etc.

- [ ] **Step 2: Run production build**

```bash
bun run build
```

Expected: build completes with `✓ built in X`. Fix any TypeScript errors before continuing:

- If you see `Type '...' is not assignable to type 'never'` on route `to` props — the route path string in `createFileRoute(...)` must exactly match TanStack Router's generated route IDs. Check the generated `routeTree.gen.ts` for the exact path strings and update `to` props in Link components to match.
- If you see `Property 'inputValidator' does not exist` — you are on a different TanStack Start version. Check `package.json` for the `@tanstack/react-start` version and adjust the API call to match.
- If you see `Cannot find module '@/lib/admin-blog-actions'` — the file was not saved correctly. Re-create it.

- [ ] **Step 3: Commit route tree**

```bash
git add src/routeTree.gen.ts
git commit -m "chore: regenerate route tree for admin routes"
```

---

## Manual Prerequisites Checklist

These must be completed in the Supabase dashboard before the admin CMS works in production:

1. **Supabase Auth** → Authentication → Providers → enable Email, create an admin user account
2. **Supabase Storage** → create a bucket named `covers`, set to Public
3. **Storage RLS** → allow authenticated users to upload to `covers` bucket:
   ```sql
   CREATE POLICY "Admin upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
   CREATE POLICY "Public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'covers');
   ```
4. **blog_posts RLS** (optional but recommended) — server functions use service role key (bypasses RLS), so public reads via anon key still need published-only policy:
   ```sql
   CREATE POLICY "Public read published" ON blog_posts FOR SELECT TO anon USING (status = 'published');
   ```
