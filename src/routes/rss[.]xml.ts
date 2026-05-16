import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://aiimanfolio.pro";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("blog_posts")
          .select("title, slug, excerpt, published_at, author_name, category")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        const items = (posts ?? [])
          .map(
            (p) =>
              `  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${BASE_URL}/blog/${p.slug}</link>
    <description><![CDATA[${p.excerpt ?? ""}]]></description>
    <pubDate>${new Date(p.published_at ?? Date.now()).toUTCString()}</pubDate>
    <author>${p.author_name ?? ""}</author>
    <category>${p.category ?? ""}</category>
    <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>
  </item>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AiimanFolio.Pro Blog</title>
    <link>${BASE_URL}</link>
    <description>Essays on design, engineering, and shipping premium products.</description>
    <language>en-us</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
