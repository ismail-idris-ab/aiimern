import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function validateToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

const projectSchema = z.object({
  token: z.string(),
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable().default(null),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  cover_image: z.string().nullable().default(null),
  live_url: z.string().nullable().default(null),
  github_url: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  status: z.string().default("draft"),
  content: z.string().nullable().default(null),
});

export const upsertProject = createServerFn({ method: "POST" })
  .inputValidator(projectSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { token, id, ...fields } = data;

    if (id) {
      const { error } = await supabaseAdmin.from("projects").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("projects").insert(fields);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const deleteSchema = z.object({ token: z.string(), id: z.string() });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator(deleteSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const getByIdSchema = z.object({ token: z.string(), id: z.string() });

export const getProjectById = createServerFn({ method: "POST" })
  .inputValidator(getByIdSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return project;
  });
