import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  slug: string;
  name: string;
  color: string;
  emoji: string;
};

export type Run = {
  id: string;
  profile_slug: string;
  date: string;
  distance_km: number;
  duration_min: number | null;
  notes: string | null;
  created_at: string;
};

export type Photo = {
  id: string;
  profile_slug: string;
  week_start: string;
  url: string;
  caption: string | null;
  created_at: string;
};

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("slug");
  if (error) throw error;
  return data as Profile[];
}

export async function fetchAllRuns(): Promise<Run[]> {
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Run[];
}

export async function fetchAllPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("week_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Photo[];
}

export async function addRun(input: {
  profile_slug: string;
  date: string;
  distance_km: number;
  duration_min?: number | null;
  notes?: string | null;
}) {
  const { error } = await supabase.from("runs").insert(input);
  if (error) throw error;
}

export async function deleteRun(id: string) {
  const { error } = await supabase.from("runs").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPhoto(file: File, profile_slug: string, weekStartIso: string, caption: string) {
  const path = `${profile_slug}/${weekStartIso}-${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const { error: upErr } = await supabase.storage.from("photos").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  const { data: signed, error: sErr } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (sErr) throw sErr;
  const { error: insErr } = await supabase.from("photos").insert({
    profile_slug,
    week_start: weekStartIso,
    url: signed.signedUrl,
    caption,
  });
  if (insErr) throw insErr;
}

export async function deletePhoto(id: string) {
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw error;
}
