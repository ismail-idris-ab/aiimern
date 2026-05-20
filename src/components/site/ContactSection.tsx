import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/lib/contact-action";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(150),
  message: z.string().trim().min(10, "Minimum 10 characters").max(2000),
  website: z.string(),
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  const onSubmit = async (values: FormData) => {
    setError(null);
    try {
      const result = await submitContact({ data: values });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error ?? "Could not send message. Please try again.");
        return;
      }
      setSent(true);
      reset();
      toast.success("Message sent! I'll get back to you within 24 hours.");
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send message. Please try again.";
      setError(msg);
      toast.error(msg);
    }
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
              { Icon: Mail, label: "Email", value: "ismailidris2222@yahoo.com" },
              { Icon: Phone, label: "Phone", value: "+243 708 586 0986" },
              { Icon: MapPin, label: "Location", value: "Remote · Nigeria" },
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
          {/* Honeypot — hidden from real users, bots fill it */}
          <input
            {...register("website")}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
            aria-hidden="true"
          />

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

          {error && <p className="text-sm text-destructive">Could not send. Please try again.</p>}

          <button type="submit" disabled={isSubmitting || sent} className="btn-gold w-full sm:w-auto disabled:opacity-60">
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : sent ? (
              <><Check size={16} /> Message sent</>
            ) : (
              <><Send size={16} /> Send message</>
            )}
          </button>

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
