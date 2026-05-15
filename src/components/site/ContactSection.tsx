import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(150).default(""),
  message: z.string().trim().min(10, "Minimum 10 characters").max(2000),
});

type FormData = z.infer<typeof schema>;

export function ContactSection() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setError(null);
    const { error } = await supabase.from("contact_messages").insert({
      name: values.name,
      email: values.email,
      subject: values.subject || "General inquiry",
      message: values.message,
    });
    if (error) {
      setError("Could not send. Please try again.");
      return;
    }
    setSent(true);
    reset();
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <section className="section-pad" id="contact">
      <div className="container-cf grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <span className="chip">Contact</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
            Let's build something <span className="gradient-text">remarkable</span>.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Tell me about your project. I'll get back within 24 hours with thoughts,
            timelines, and next steps.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { Icon: Mail, label: "Email", value: "hello@craftfolio.pro" },
              { Icon: Phone, label: "Phone", value: "+1 (415) 555-0142" },
              { Icon: MapPin, label: "Location", value: "Remote · San Francisco" },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 card-cf p-7 md:p-9 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Name" error={errors.name?.message}>
              <input {...register("name")} className="cf-input" placeholder="Your name" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} type="email" className="cf-input" placeholder="you@email.com" />
            </Field>
          </div>
          <Field label="Subject" error={errors.subject?.message}>
            <input {...register("subject")} className="cf-input" placeholder="Project inquiry" />
          </Field>
          <Field label="Message" error={errors.message?.message}>
            <textarea {...register("message")} rows={6} className="cf-input resize-none" placeholder="Tell me a bit about your project, timeline, and budget…" />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={isSubmitting || sent} className="btn-gold w-full sm:w-auto disabled:opacity-60">
            {isSubmitting ? (<><Loader2 size={16} className="animate-spin" /> Sending…</>)
              : sent ? (<><Check size={16} /> Message sent</>)
              : (<><Send size={16} /> Send message</>)}
          </button>

          <style>{`
            .cf-input {
              width: 100%;
              background: var(--surface-soft);
              border: 1px solid var(--border);
              border-radius: 0.75rem;
              padding: 0.75rem 1rem;
              color: var(--foreground);
              font-size: 0.95rem;
              transition: border-color .2s ease, background .2s ease;
            }
            .cf-input::placeholder { color: var(--muted-foreground); }
            .cf-input:focus { outline: none; border-color: var(--primary); background: color-mix(in oklab, var(--primary) 5%, var(--surface-soft)); }
          `}</style>
        </form>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}
