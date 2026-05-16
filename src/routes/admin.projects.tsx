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
