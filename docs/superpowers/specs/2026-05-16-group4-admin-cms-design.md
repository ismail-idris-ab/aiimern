# Group 4 — Admin CMS Design Spec

## Overview

Protected admin dashboard for managing blog posts and projects. Supabase Auth (email/password) gates all admin routes. Full CRUD for both content types. Markdown editor with live preview for post/project content. Cover image upload to Supabase Storage.

---

## Section 1: Architecture

### Routes

TanStack Router flat file naming. All routes under `admin.tsx` layout:

```
src/routes/admin.tsx                     ← layout: sidebar + auth guard
src/routes/admin.index.tsx              ← redirect → /admin/blog
src/routes/admin.login.tsx              ← login form (no sidebar)
src/routes/admin.blog.tsx               ← blog list at /admin/blog
src/routes/admin.blog_.new.tsx          ← /admin/blog/new
src/routes/admin.blog_.$id.edit.tsx     ← /admin/blog/$id/edit
src/routes/admin.projects.tsx           ← projects list at /admin/projects
src/routes/admin.projects_.new.tsx      ← /admin/projects/new
src/routes/admin.projects_.$id.edit.tsx ← /admin/projects/$id/edit
```

Trailing underscore (`blog_`, `projects_`) breaks the parent-layout relationship so new/edit pages are children of `admin.tsx` (not of `admin.blog.tsx`).

### Auth Guard

`admin.tsx` loader calls `supabase.auth.getSession()`. If no session and current path is not `/admin/login`, throws `redirect({ to: "/admin/login" })`. Sidebar renders only when session exists.

### Server Functions

```
src/lib/admin-blog-actions.ts      ← upsertPost(token, data), deletePost(token, id)
src/lib/admin-project-actions.ts   ← upsertProject(token, data), deleteProject(token, id)
```

Each server function:
1. Accepts `token: string` alongside the payload
2. Validates via `supabaseAdmin.auth.getUser(token)` — returns 401-equivalent error if invalid
3. Uses `supabaseAdmin` (service role) to bypass RLS for all DB writes

### Image Upload

`src/lib/upload-cover.ts` — client-side helper:
- `supabase.storage.from("covers").upload(path, file, { upsert: true })`
- Returns `supabase.storage.from("covers").getPublicUrl(path).data.publicUrl`
- Requires a `covers` public bucket in Supabase Storage (manual setup step)

### Styling Constraint

No new color tokens, no new design tokens. Reuse: `.card-cf`, `.btn-gold`, `.btn-ghost`, `.chip`, `.gradient-text`, `.section-pad`, `.prose-cf`.

Move `.cf-input` from ContactSection's inline `<style>` block into `src/styles.css @layer components` so admin forms share the same input styling.

---

## Section 2: Blog Post Editor

### List Page (`/admin/blog`)

Table with columns: Title, Status (chip: draft/published), Created At, Actions (Edit button → `/admin/blog/$id/edit`, Delete button).

Delete flow: inline confirmation state per row (`confirming` boolean) — first click shows "Confirm?" text + confirm button, second click calls `deletePost`. No modal needed.

### Shared `PostForm` Component

`src/components/admin/PostForm.tsx` — used by both new and edit pages.

**Fields:**
| Field | Input | Notes |
|-------|-------|-------|
| title | text | on blur: auto-generate slug if slug is empty |
| slug | text | editable; auto-gen: `title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-\|-$)/g, "")` |
| excerpt | textarea (3 rows) | — |
| category | text | — |
| tags | text | comma-separated; split to `string[]` on save |
| cover_image | text + Upload button | upload via `upload-cover.ts`; URL auto-fills field |
| status | select | `draft` \| `published` |
| content | split-pane | left: markdown textarea; right: `.prose-cf` live preview |

### Content Preview

`useEffect` on `content` value — debounced 300ms → `parseMarkdown(content).then(({ html }) => setPreviewHtml(html))`. Preview pane renders `<div className="prose-cf" dangerouslySetInnerHTML={{ __html: previewHtml }} />`.

### Save Flow

`handleSubmit` → `upsertPost({ token: session.access_token, data })` → on success redirect to `/admin/blog`.

Edit page: loader fetches post by id via `supabaseAdmin` (server loader), pre-fills form. Upsert matches on `id`.

New page: no loader needed. Upsert inserts new row (no `id` in payload).

---

## Section 3: Projects Editor + Admin Layout

### Projects List (`/admin/projects`)

Same table pattern as blog: Title, Category, Status, Sort Order, Edit + Delete actions.

### Shared `ProjectForm` Component

`src/components/admin/ProjectForm.tsx`

**Fields:**
| Field | Input | Notes |
|-------|-------|-------|
| title | text | slug auto-gen on blur |
| slug | text | editable |
| excerpt | textarea (3 rows) | — |
| category | text | — |
| tags | text | comma-separated |
| cover_image | text + Upload button | same upload helper |
| live_url | text | — |
| github_url | text | — |
| featured | checkbox | — |
| sort_order | number | — |
| status | select | `draft` \| `published` |
| content | split-pane markdown editor | case study body |

Save flow identical to blog posts.

### Admin Layout (`admin.tsx`)

Sidebar (left, `w-56`, dark navy using `var(--background)` + `var(--border)` right border):
- Top: "AiimanFolio" logo text in `font-display` + "Admin" chip
- Nav links: Blog Posts (`/admin/blog`), Projects (`/admin/projects`)
  - Active: `text-primary` + `border-l-2 border-primary pl-3`
  - Inactive: `text-muted-foreground hover:text-foreground`
- Bottom: Sign Out button (`.btn-ghost`) → `supabase.auth.signOut()` → redirect `/admin/login`

Main content area: `flex-1 overflow-auto p-8`

Layout renders sidebar only when session is present. When no session (login page), renders `<Outlet />` full-width.

### Login Page (`admin.login.tsx`)

Centered `.card-cf p-8` form:
- Email input (`.cf-input`)
- Password input (`.cf-input`)
- `.btn-gold w-full` submit
- Error message below form on failure

On submit: `supabase.auth.signInWithPassword({ email, password })`. On success: redirect to `/admin/blog`.

---

## Manual Prerequisites (user actions required before deploy)

1. **Supabase Storage**: Create a `covers` public bucket in Supabase dashboard
2. **Supabase Auth**: Enable email/password auth provider; create admin user account
3. **Supabase RLS**: Ensure `blog_posts` and `projects` tables have RLS enabled (server functions use service role key, bypassing RLS — public read via anon key still works)

---

## What This Does NOT Include

- Role-based access (single admin user only)
- Drag-and-drop sort order (edit `sort_order` field manually)
- Image cropping or resizing
- Post scheduling / publish-at date
- Analytics or dashboard metrics
