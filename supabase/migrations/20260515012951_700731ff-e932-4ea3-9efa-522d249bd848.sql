
CREATE TYPE public.post_status AS ENUM ('draft', 'published');

CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL DEFAULT 'CraftFolio',
  status public.post_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  reading_time INTEGER NOT NULL DEFAULT 3,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_status_published_at_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- Seed a few published blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, category, tags, author_name, status, featured, reading_time, published_at, cover_image) VALUES
('Designing for Dark Mode the Right Way', 'designing-for-dark-mode',
 'Practical principles for crafting elegant, accessible dark interfaces that feel premium.',
 E'## Why dark mode matters\n\nDark mode is more than a toggle. It changes how users perceive hierarchy, depth, and accent colors.\n\n## Contrast and hierarchy\n\nUse layered surfaces — background, surface, surface-soft — and reserve your accent color for primary actions only.\n\n## Accessibility\n\nAim for WCAG AA contrast on body text. Test with real content, not lorem ipsum.',
 'Design', ARRAY['design','ui','dark-mode'], 'Alex Carter', 'published', true, 6, now() - interval '2 days',
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=80'),

('Shipping Fast with TanStack Start', 'shipping-fast-with-tanstack-start',
 'How a typed router, SSR, and server functions remove the seams between frontend and backend.',
 E'## A single mental model\n\nTanStack Start collapses pages, loaders, and server functions into one type-safe graph.\n\n## Where the value shows up\n\nFewer round-trips. Better DX. Faster TTI.',
 'Engineering', ARRAY['react','tanstack','ssr'], 'Alex Carter', 'published', false, 5, now() - interval '5 days',
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80'),

('A Pragmatic Guide to Web Performance', 'pragmatic-guide-web-performance',
 'The 20% of optimizations that deliver 80% of the perceived speed.',
 E'## Measure first\n\nLighthouse, WebPageTest, real-user monitoring.\n\n## The big wins\n\nImage formats, font loading, code splitting, and caching.',
 'Performance', ARRAY['performance','web-vitals'], 'Alex Carter', 'published', false, 7, now() - interval '10 days',
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80'),

('Building a Personal Brand as a Developer', 'personal-brand-as-developer',
 'Why writing, sharing, and shipping in public compounds your career.',
 E'## Start small\n\nOne post, one project, one talk. Compounding takes time.\n\n## Be consistent\n\nShow up weekly, not daily.',
 'Career', ARRAY['career','writing'], 'Alex Carter', 'published', false, 4, now() - interval '14 days',
 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1600&q=80'),

('Type-Safe APIs from Database to UI', 'type-safe-apis-db-to-ui',
 'Eliminating the runtime gap between Postgres, your server, and React.',
 E'## End-to-end types\n\nGenerated database types flow through server functions to components.\n\n## What you stop debugging\n\nField name typos. Nullability mismatches. Stale shapes.',
 'Engineering', ARRAY['typescript','postgres'], 'Alex Carter', 'published', false, 6, now() - interval '20 days',
 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1600&q=80'),

('Micro-interactions That Don''t Annoy Users', 'micro-interactions-that-work', 
 'A short field guide to motion that feels intentional, not decorative.',
 E'## Motion with meaning\n\nAnimate state changes, not page loads.\n\n## Restraint\n\nIf every element moves, nothing stands out.',
 'Design', ARRAY['motion','ux'], 'Alex Carter', 'published', false, 5, now() - interval '25 days',
 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1600&q=80');
