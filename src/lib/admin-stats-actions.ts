import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const tokenSchema = z.object({ token: z.string() });

async function validateToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

export const getAdminStats = createServerFn({ method: "POST" })
  .inputValidator(tokenSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);

    const [
      { count: totalPosts },
      { count: publishedPosts },
      { count: totalProjects },
      { count: publishedProjects },
      { count: totalMessages },
      { data: recentMessages },
    ] = await Promise.all([
      supabaseAdmin.from("blog_posts").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("contact_messages")
        .select("id, name, email, subject, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      totalPosts: totalPosts ?? 0,
      publishedPosts: publishedPosts ?? 0,
      draftPosts: (totalPosts ?? 0) - (publishedPosts ?? 0),
      totalProjects: totalProjects ?? 0,
      publishedProjects: publishedProjects ?? 0,
      draftProjects: (totalProjects ?? 0) - (publishedProjects ?? 0),
      totalMessages: totalMessages ?? 0,
      recentMessages: recentMessages ?? [],
    };
  });
