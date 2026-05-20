import { createServerFn } from "@tanstack/react-start";
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

type ContactInput = z.infer<typeof schema>;
type ContactResult = { ok: true } | { ok: false; error: string };

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }: { data: ContactInput }): Promise<ContactResult> => {
    // 1. Honeypot — silently succeed so bots think it worked
    if (data.website) return { ok: true };

    // 2. Rate limiting — 3 submissions per email per hour via Supabase
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("email", data.email)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= 3) {
      return { ok: false, error: "Too many requests. Please try again later." };
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
          from: "onboarding@resend.dev",
          to: notifEmail,
          subject: `New contact: ${data.subject || "General inquiry"}`,
          html: `<p><strong>From:</strong> ${esc(data.name)} &lt;${esc(data.email)}&gt;</p><p><strong>Subject:</strong> ${esc(data.subject || "General inquiry")}</p><p><strong>Message:</strong></p><p>${esc(data.message).replace(/\n/g, "<br>")}</p>`,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.text();
            console.error("[Resend] Failed to send notification:", res.status, body);
          }
        })
        .catch((err) => console.error("[Resend] Network error:", err));
    }

    return { ok: true };
  });
