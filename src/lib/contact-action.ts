/// <reference types="@cloudflare/workers-types" />
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { getEvent } from "vinxi/http";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10).max(2000),
  website: z.string().default(""),
});

type ContactResult = { ok: true } | { ok: false; error: string };

export const submitContact = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ContactResult> => {
    // 1. Honeypot — silently succeed so bots think it worked
    if (data.website) return { ok: true };

    // 2. Cloudflare KV rate limiting (3 submissions per IP per hour)
    try {
      const webReq = getWebRequest();
      const ip = webReq?.headers.get("cf-connecting-ip") ?? "unknown";
      const event = getEvent();
      const cfEnv = (event?.context as any)?.cloudflare?.env;
      const kv: KVNamespace | undefined = cfEnv?.CONTACT_RATE_KV;

      if (kv) {
        const key = `contact_rate:${ip}`;
        const raw = await kv.get(key);
        const count = raw ? parseInt(raw, 10) : 0;
        if (count >= 3) {
          return { ok: false, error: "Too many requests. Please try again later." };
        }
        const now = new Date();
        const secondsUntilNextHour = (60 - now.getMinutes()) * 60 - now.getSeconds();
        await kv.put(key, String(count + 1), {
          expirationTtl: secondsUntilNextHour > 0 ? secondsUntilNextHour : 3600,
        });
      }
    } catch {
      // KV unavailable in dev — skip rate limiting
    }

    // 3. Insert to Supabase
    const { error: dbError } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || "General inquiry",
      message: data.message,
    });
    if (dbError) return { ok: false, error: "Could not send. Please try again." };

    // 4. Resend notification (fire-and-forget — don't fail submission if email fails)
    const resendKey = process.env.RESEND_API_KEY;
    const notifEmail = process.env.NOTIFICATION_EMAIL;
    if (resendKey && notifEmail) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@aiimanfolio.pro",
          to: notifEmail,
          subject: `New contact: ${data.subject || "General inquiry"}`,
          html: `<p><strong>From:</strong> ${esc(data.name)} &lt;${esc(data.email)}&gt;</p><p><strong>Subject:</strong> ${esc(data.subject || "General inquiry")}</p><p><strong>Message:</strong></p><p>${esc(data.message).replace(/\n/g, "<br>")}</p>`,
        }),
      }).catch(() => {});
    }

    return { ok: true };
  });
