import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, FolderOpen, Mail, FileEdit, Plus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminStats } from "@/lib/admin-stats-actions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stats = Awaited<ReturnType<typeof getAdminStats>>;

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const result = await getAdminStats({ data: { token: session.access_token } });
        setStats(result);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Posts", value: stats.totalPosts, sub: `${stats.publishedPosts} published · ${stats.draftPosts} drafts`, Icon: BookOpen, to: "/admin/blog" },
        { label: "Total Projects", value: stats.totalProjects, sub: `${stats.publishedProjects} published · ${stats.draftProjects} drafts`, Icon: FolderOpen, to: "/admin/projects" },
        { label: "Contact Messages", value: stats.totalMessages, sub: "All time", Icon: Mail, to: null },
      ]
    : [];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your portfolio content</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/blog_/new" className="btn-ghost flex items-center gap-2 text-sm">
            <Plus size={14} /> New Post
          </Link>
          <Link to="/admin/projects_/new" className="btn-gold flex items-center gap-2 text-sm">
            <Plus size={14} /> New Project
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-cf p-6 animate-pulse space-y-3">
                <div className="h-3 w-24 bg-surface-soft rounded" />
                <div className="h-8 w-12 bg-surface-soft rounded" />
                <div className="h-3 w-32 bg-surface-soft rounded" />
              </div>
            ))
          : statCards.map(({ label, value, sub, Icon, to }) => {
              const inner = (
                <div className="card-cf p-6 space-y-3 h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
                    <span className="grid place-items-center size-8 rounded-lg bg-primary/10 text-primary">
                      <Icon size={15} />
                    </span>
                  </div>
                  <div className="text-3xl font-display font-semibold">{value}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
              );
              return to ? (
                <Link key={label} to={to} className="block hover:opacity-90 transition-opacity">{inner}</Link>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}
      </div>

      {/* Recent messages */}
      <div className="card-cf overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 font-medium text-sm">
            <TrendingUp size={15} className="text-primary" />
            Recent Messages
          </div>
          <span className="text-xs text-muted-foreground">{stats?.totalMessages ?? "—"} total</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-soft rounded animate-pulse" />
            ))}
          </div>
        ) : !stats?.recentMessages.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No messages yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Name</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium hidden sm:table-cell">Subject</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentMessages.map((msg, i) => (
                <tr key={msg.id} className={i < stats.recentMessages.length - 1 ? "border-b border-[var(--border)]" : ""}>
                  <td className="px-5 py-3 font-medium">{msg.name}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell truncate max-w-[180px]">{msg.subject || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{msg.email}</td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { to: "/admin/blog", Icon: BookOpen, label: "Manage Blog Posts", desc: "Create, edit, publish articles" },
          { to: "/admin/projects", Icon: FolderOpen, label: "Manage Projects", desc: "Showcase and update your work" },
        ].map(({ to, Icon, label, desc }) => (
          <Link key={to} to={to} className="card-cf p-5 flex items-center gap-4 hover:border-primary transition-colors group">
            <span className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon size={18} />
            </span>
            <div>
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <FileEdit size={14} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
