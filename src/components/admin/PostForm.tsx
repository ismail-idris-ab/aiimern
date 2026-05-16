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
