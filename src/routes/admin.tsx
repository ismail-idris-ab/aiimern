import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { BookOpen, FolderOpen, LogOut, LayoutDashboard } from "lucide-react";
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
    { to: "/admin/", label: "Dashboard", Icon: LayoutDashboard },
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
            const active = to === "/admin/"
              ? location.pathname === "/admin" || location.pathname === "/admin/"
              : location.pathname.startsWith(to);
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
