import { useEffect, useState } from "react";

const KEY = "active_profile";

export function useActiveProfile() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    setSlug(v);
  }, []);

  const update = (next: string | null) => {
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    }
    setSlug(next);
  };

  return [slug, update] as const;
}
