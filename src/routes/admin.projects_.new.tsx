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
