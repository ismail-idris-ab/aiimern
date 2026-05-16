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
