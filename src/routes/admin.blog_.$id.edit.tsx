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
