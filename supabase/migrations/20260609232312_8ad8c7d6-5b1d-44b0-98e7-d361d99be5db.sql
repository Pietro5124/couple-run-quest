
CREATE TABLE public.profiles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug TEXT NOT NULL REFERENCES public.profiles(slug) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_km NUMERIC(6,2) NOT NULL CHECK (distance_km > 0),
  duration_min INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX runs_profile_date_idx ON public.runs(profile_slug, date DESC);

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug TEXT NOT NULL REFERENCES public.profiles(slug) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX photos_profile_week_idx ON public.photos(profile_slug, week_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO anon, authenticated;
GRANT ALL ON public.profiles, public.runs, public.photos TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_runs" ON public.runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_photos" ON public.photos FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.profiles (slug, name, color, emoji) VALUES
  ('pietro', 'Pietro', 'cyan', '🏃‍♂️'),
  ('ana', 'Ana Beatriz', 'orange', '🏃‍♀️');
