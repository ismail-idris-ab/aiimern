
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_status_sort_idx ON public.projects (status, sort_order ASC);
CREATE INDEX projects_slug_idx ON public.projects (slug);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage projects"
  ON public.projects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed sample projects
INSERT INTO public.projects (title, slug, excerpt, content, category, tags, cover_image, live_url, github_url, featured, sort_order, status) VALUES

('AiimanFolio Pro', 'aiiman-folio-pro',
 'A premium dark-navy portfolio and blog platform built for developers who care about every detail.',
 E'## Overview\n\nAiimanFolio Pro is a full-stack portfolio platform built with TanStack Start, deployed to Cloudflare Workers.\n\n## Tech stack\n\nTanStack Start (SSR), React 19, Tailwind CSS v4, Supabase, Cloudflare Workers.\n\n## Key features\n\n- SSR with TanStack Router file-based routing\n- Admin CMS for blog posts and projects\n- Markdown content with Shiki syntax highlighting\n- Full-text search, category/tag filtering, pagination\n- Image upload to Supabase Storage\n- Honeypot-protected contact form',
 'Full-Stack', ARRAY['tanstack','react','supabase','cloudflare','tailwind'],
 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80',
 NULL,
 'https://github.com/ismail-idris-ab',
 true, 1, 'published'),

('DevMetrics Dashboard', 'dev-metrics-dashboard',
 'Real-time engineering analytics dashboard that surfaces PR cycle time, deploy frequency, and team health metrics.',
 E'## Problem\n\nEngineering managers lacked visibility into delivery performance without expensive tooling.\n\n## Solution\n\nBuilt a lightweight dashboard that pulls from GitHub and Linear APIs, aggregates DORA metrics, and visualises trends over time.\n\n## Stack\n\nNext.js App Router, Recharts, Prisma, PlanetScale, GitHub OAuth.\n\n## Outcome\n\nCut weekly standup prep from 30 minutes to under 5 minutes for a 12-person team.',
 'Product', ARRAY['nextjs','recharts','prisma','github-api'],
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
 NULL,
 'https://github.com/ismail-idris-ab',
 true, 2, 'published'),

('Syntax — Code Snippet Share', 'syntax-snippet-share',
 'Minimal tool for sharing beautiful, syntax-highlighted code snippets with a single URL.',
 E'## What it does\n\nPaste code, pick a language, get a shareable link with full Shiki highlighting and dark/light mode.\n\n## Why I built it\n\nExisting tools had ads, sign-up walls, or ugly output. I wanted something that looked as good as the code.\n\n## Stack\n\nRemix, Shiki, Cloudflare KV for storage, no database required.\n\n## Design decisions\n\nZero-JS on the read path — every shared snippet is fully SSR-rendered with no hydration overhead.',
 'Tool', ARRAY['remix','shiki','cloudflare-kv'],
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80',
 NULL,
 'https://github.com/ismail-idris-ab',
 false, 3, 'published'),

('Forma — Design Token Manager', 'forma-design-token-manager',
 'CLI + web UI for managing, documenting, and exporting design tokens across Figma, CSS, and JS.',
 E'## Context\n\nDesign-to-code handoff breaks down when tokens live in Figma but not in code (or vice versa).\n\n## What Forma does\n\nA single YAML source of truth syncs to Figma Variables, CSS custom properties, and TypeScript constants in one command.\n\n## Stack\n\nNode.js CLI, SvelteKit web UI, Figma REST API, `style-dictionary`.\n\n## Impact\n\nAdopted by 3 open-source design systems after a Product Hunt launch.',
 'Design Systems', ARRAY['nodejs','svelte','figma-api','design-tokens'],
 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1600&q=80',
 NULL,
 'https://github.com/ismail-idris-ab',
 false, 4, 'published'),

('Pulse — Status Page Builder', 'pulse-status-page',
 'Self-hosted status page and uptime monitoring with incident management and subscriber notifications.',
 E'## Motivation\n\nHosted status page services cost $30–100/month. I wanted a self-hostable alternative under $5/month.\n\n## Features\n\n- Cron-based uptime checks via Cloudflare Workers\n- Incident timeline with real-time updates\n- Email subscriber notifications via Resend\n- Embeddable status widget\n\n## Stack\n\nTanStack Start, Cloudflare Workers + KV, Resend, Tailwind CSS.\n\n## Hosting cost\n\n~$0 on the free tier for most indie projects.',
 'Tool', ARRAY['cloudflare-workers','tanstack','resend','uptime'],
 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80',
 NULL,
 'https://github.com/ismail-idris-ab',
 false, 5, 'published');
