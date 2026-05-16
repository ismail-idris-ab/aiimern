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
