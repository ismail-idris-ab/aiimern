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
