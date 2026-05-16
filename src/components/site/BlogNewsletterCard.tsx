import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = "idle" | "loading" | "success";

export function BlogNewsletterCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    await supabase.from("newsletter_subscribers").insert({ email });
    setState("success");
  };

  if (state === "success") {
    return (
      <div className="card-cf p-8 text-center my-12">
        <p className="text-lg font-semibold gradient-text">You're in!</p>
        <p className="text-sm text-muted-foreground mt-1">
          More essays coming your way.
        </p>
      </div>
    );
  }

  return (
    <div className="card-cf p-8 text-center my-12">
      <h3 className="text-xl font-display font-semibold">Enjoyed this?</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Get more essays on design and engineering. No spam. Unsubscribe any
        time.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 max-w-sm mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 bg-surface-soft border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-gold"
        >
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
