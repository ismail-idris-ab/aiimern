import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function validateToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

const postSchema = z.object({
  token: z.string(),
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().default(""),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  cover_image: z.string().nullable().default(null),
  status: z.enum(["draft", "published"]).default("draft"),
  content: z.string().default(""),
  author_name: z.string().default("Aiiman"),
  reading_time: z.number().int().min(1).default(5),
  featured: z.boolean().default(false),
  seo_title: z.string().nullable().default(null),
  seo_description: z.string().nullable().default(null),
  og_image: z.string().nullable().default(null),
});

export const upsertPost = createServerFn({ method: "POST" })
  .inputValidator(postSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { token, id, ...fields } = data;
    const now = new Date().toISOString();
    const payload = { ...fields, updated_at: now };

    if (id) {
      const { error } = await supabaseAdmin.from("blog_posts").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("blog_posts").insert({
        ...payload,
        ...(fields.status === "published" ? { published_at: now } : {}),
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const deleteSchema = z.object({ token: z.string(), id: z.string() });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator(deleteSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const getByIdSchema = z.object({ token: z.string(), id: z.string() });

export const getPostById = createServerFn({ method: "POST" })
  .inputValidator(getByIdSchema)
  .handler(async ({ data }) => {
    await validateToken(data.token);
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return post;
  });
