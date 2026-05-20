# Cloudflare Workers → Vercel Migration Design

**Date:** 2026-05-20  
**Project:** AiimanFolio.Pro (artisanal-dev-hub)  
**Status:** Approved

---

## Goal

Migrate deployment target from Cloudflare Workers to Vercel (Node.js serverless), preserving all custom server logic (SSR error normalization, cache headers).

---

## Architecture

**Before:**
```
Request → Cloudflare Workers → src/server.ts (CF Workers fetch handler) → TanStack Start SSR
```

**After:**
```
Request → Vercel CDN (static) or Vercel Serverless Function (Node.js) → src/server.ts (Node handler) → TanStack Start SSR
```

Static assets (JS/CSS/images) served by Vercel CDN directly. SSR HTML responses and server functions route through the serverless function. Supabase and Resend integrations are unchanged.

---

## File Changes

### Remove
- `wrangler.jsonc` — Cloudflare Workers config, no longer needed
- `src/server.ts` — Cloudflare Workers `fetch(req, env, ctx)` handler (replaced)

### Replace
- `vite.config.ts` — Eject from `@lovable.dev/vite-tanstack-config`; write manual config using TanStack Start's Vercel preset. Replicate all bundled plugins manually: `@tanstack/react-start/plugin`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`. Set `server.preset = 'vercel'`.

### Add
- `src/server.ts` (new) — Node.js-compatible server entry. Port existing logic: h3 error normalization, cache headers (`s-maxage=60, stale-while-revalidate=86400`), branded error page fallback. Wrap TanStack Start's Node entry.
- `vercel.json` — Route all requests to the SSR function; configure output directory.

### Update
- `package.json` — Remove `wrangler`, `@cloudflare/vite-plugin`. Update build/preview scripts if needed. May remove `@lovable.dev/vite-tanstack-config` if no longer needed after eject.
- `CLAUDE.md` — Update deploy target references from Cloudflare Workers to Vercel.

---

## Dependencies

| Action | Package |
|--------|---------|
| Remove | `wrangler` |
| Remove | `@cloudflare/vite-plugin` (was bundled in `@lovable.dev/vite-tanstack-config`) |
| Add | `@tanstack/react-start/plugin` (if not already a direct dep) |
| Add | `@vitejs/plugin-react` |
| Keep | `@tailwindcss/vite`, `vite-tsconfig-paths` (already direct deps) |

---

## vite.config.ts Eject Strategy

`@lovable.dev/vite-tanstack-config` bundles these plugins (from CLAUDE.md + package.json analysis):
- `@tanstack/react-start/plugin` (TanStack Start with Cloudflare preset)
- `@vitejs/plugin-react`
- `@tailwindcss/vite`
- `vite-tsconfig-paths`
- `@cloudflare/vite-plugin` (build-only) ← **replaced by Vercel preset**
- Component tagger (dev-only, Lovable-specific — can be dropped)
- VITE_* env injection
- `@` path alias

New `vite.config.ts` replicates all of the above except the Cloudflare plugin, using TanStack Start's built-in `serverPreset: 'vercel'`.

---

## server.ts Port Plan

Current `src/server.ts` exports a Cloudflare Workers handler:
```ts
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) { ... }
}
```

New `src/server.ts` exports a Node.js handler compatible with TanStack Start's Vercel integration:
```ts
import { createServer } from '@tanstack/react-start/server'
// Wrap with same cache header + h3 error normalization logic
```

Exact signature depends on TanStack Start's Vercel adapter API (check during implementation).

---

## Environment Variables

Move from `wrangler.jsonc` `vars` section → **Vercel Dashboard > Project > Environment Variables**:

| Key | Where to set |
|-----|-------------|
| `SUPABASE_URL` | Vercel env vars |
| `SUPABASE_PUBLISHABLE_KEY` | Vercel env vars |
| `VITE_SUPABASE_URL` | Vercel env vars |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel env vars |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env vars (sensitive) |
| `RESEND_API_KEY` | Vercel env vars (sensitive) |
| `NOTIFICATION_EMAIL` | Vercel env vars |

Local `.env` file stays for local dev — no changes needed.

---

## Deployment Flow After Migration

1. Push repo to GitHub (if not already)
2. Create Vercel project, connect repo
3. Set all env vars in Vercel dashboard
4. Set build command: `bun run build`
5. Vercel auto-deploys on push to main
6. Static assets → Vercel CDN; SSR → serverless function

---

## Out of Scope

- Custom domain setup (DNS transfer from Cloudflare — separate step, user handles)
- Supabase changes (none needed)
- Any feature changes to the portfolio itself
