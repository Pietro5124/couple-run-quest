import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllPhotos,
  fetchAllRuns,
  fetchProfiles,
  addRun,
  uploadPhoto,
  deletePhoto,
  deleteRun,
  type Profile,
  type Run,
  type Photo,
} from "@/lib/api";
import { xpFromKm, weekStart, isoDate, formatBR, levelFromXp, MIN_KM } from "@/lib/fitness";
import { useActiveProfile } from "@/lib/useActiveProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity,
  Flame,
  Footprints,
  Heart,
  Plus,
  Trash2,
  Trophy,
  Upload,
  Gift,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useActiveProfile();

  const profilesQ = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const runsQ = useQuery({ queryKey: ["runs"], queryFn: fetchAllRuns });
  const photosQ = useQuery({ queryKey: ["photos"], queryFn: fetchAllPhotos });

  const profiles = profilesQ.data ?? [];
  const runs = runsQ.data ?? [];
  const photos = photosQ.data ?? [];

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["runs"] });
    qc.invalidateQueries({ queryKey: ["photos"] });
  };

  if (!activeSlug) {
    return <ProfilePicker profiles={profiles} onPick={(s) => setActiveSlug(s)} />;
  }

  const active = profiles.find((p) => p.slug === activeSlug) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8">
      <Header active={active} onSwitch={() => setActiveSlug(null)} />

      <WeeklyRanking profiles={profiles} runs={runs} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {profiles.map((p) => (
          <ProfileStatsCard
            key={p.slug}
            profile={p}
            runs={runs.filter((r) => r.profile_slug === p.slug)}
            isActive={p.slug === activeSlug}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Histórico</h2>
        {active && <AddRunDialog active={active} onAdded={invalidateAll} />}
      </div>

      <Tabs defaultValue="calendar" className="mt-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="runs">Corridas</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4 space-y-6">
          {profiles.map((p) => (
            <ContributionsCalendar
              key={p.slug}
              profile={p}
              runs={runs.filter((r) => r.profile_slug === p.slug)}
            />
          ))}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          <RunsList runs={runs} profiles={profiles} activeSlug={activeSlug} onChanged={invalidateAll} />
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <PhotosSection
            profiles={profiles}
            photos={photos}
            activeSlug={activeSlug}
            onChanged={invalidateAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────────── Profile picker ────────────── */

function ProfilePicker({ profiles, onPick }: { profiles: Profile[]; onPick: (s: string) => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Heart className="size-3 text-primary" /> Pietro & Ana Beatriz
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          Quem está correndo?
        </h1>
        <p className="mt-2 text-muted-foreground">Selecione seu perfil para começar</p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {profiles.map((p) => (
          <button
            key={p.slug}
            onClick={() => onPick(p.slug)}
            className={cn(
              "group relative overflow-hidden rounded-3xl border-2 bg-card p-8 text-left transition-all hover:-translate-y-1 hover:shadow-2xl",
              p.slug === "pietro" ? "hover:border-pietro" : "hover:border-ana",
            )}
          >
            <div
              className={cn(
                "absolute -right-10 -top-10 size-40 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40",
                p.slug === "pietro" ? "bg-pietro" : "bg-ana",
              )}
            />
            <div className="text-6xl">{p.emoji}</div>
            <div className="mt-6 font-display text-3xl font-bold">{p.name}</div>
            <div className={cn("mt-1 text-sm font-medium", p.slug === "pietro" ? "text-pietro" : "text-ana")}>
              Entrar como {p.name.split(" ")[0]} →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────── Header ────────────── */

function Header({ active, onSwitch }: { active: Profile | null; onSwitch: () => void }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
          <Activity className="size-5" />
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-none">RunDuo</div>
          <div className="text-xs text-muted-foreground">Pietro × Ana Beatriz</div>
        </div>
      </div>
      {active && (
        <button
          onClick={onSwitch}
          className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <span className="text-base">{active.emoji}</span>
          <span>{active.name.split(" ")[0]}</span>
          <LogOut className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </header>
  );
}

/* ────────────── Weekly Ranking ────────────── */

function WeeklyRanking({ profiles, runs }: { profiles: Profile[]; runs: Run[] }) {
  const ws = weekStart(new Date());
  const wsIso = isoDate(ws);

  const weekStats = profiles.map((p) => {
    const weekRuns = runs.filter((r) => r.profile_slug === p.slug && r.date >= wsIso);
    const xp = weekRuns.reduce((s, r) => s + xpFromKm(Number(r.distance_km)), 0);
    const km = weekRuns.reduce((s, r) => s + Number(r.distance_km), 0);
    return { profile: p, xp, km, runs: weekRuns.length };
  });

  const sorted = [...weekStats].sort((a, b) => b.xp - a.xp);
  const leader = sorted[0]?.xp > 0 ? sorted[0] : null;
  const tied = sorted.length === 2 && sorted[0].xp === sorted[1].xp && sorted[0].xp > 0;

  const reward =
    !leader
      ? null
      : tied
        ? { icon: "🤝", text: "Empate técnico! Semana ainda em jogo." }
        : leader.profile.slug === "pietro"
          ? { icon: "👠", text: "Ana usa salto na próxima saída ✨" }
          : { icon: "💆‍♂️🍝🍰", text: "Pietro paga: massagem + jantarzinho + sobremesa" };

  return (
    <Card className="mt-6 overflow-hidden border-2">
      <div className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-4 text-primary" /> Ranking da semana
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {weekStats.map((s) => {
            const isLead = !tied && leader?.profile.slug === s.profile.slug;
            return (
              <div
                key={s.profile.slug}
                className={cn(
                  "rounded-2xl border-2 bg-card p-4 transition-all",
                  isLead && (s.profile.slug === "pietro" ? "border-pietro shadow-lg" : "border-ana shadow-lg"),
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{s.profile.emoji}</span>
                    <span className="font-display font-bold">{s.profile.name}</span>
                  </div>
                  {isLead && (
                    <Badge className={cn(s.profile.slug === "pietro" ? "bg-pietro" : "bg-ana")}>
                      <Trophy className="mr-1 size-3" /> Líder
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">{s.xp}</span>
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.km.toFixed(1)} km · {s.runs} {s.runs === 1 ? "corrida" : "corridas"}
                </div>
              </div>
            );
          })}
        </div>
        {reward && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-primary/30 bg-card p-4">
            <div className="text-2xl">{reward.icon}</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                <Gift className="mr-1 inline size-3" /> Conquista
              </div>
              <div className="text-sm font-medium">{reward.text}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ────────────── Stats Cards ────────────── */

function ProfileStatsCard({ profile, runs, isActive }: { profile: Profile; runs: Run[]; isActive: boolean }) {
  const totalKm = runs.reduce((s, r) => s + Number(r.distance_km), 0);
  const totalXp = runs.reduce((s, r) => s + xpFromKm(Number(r.distance_km)), 0);
  const valid = runs.filter((r) => Number(r.distance_km) >= MIN_KM).length;
  const { level, xpInLevel, xpForNext } = levelFromXp(totalXp);

  const accent = profile.slug === "pietro" ? "bg-pietro" : "bg-ana";
  const text = profile.slug === "pietro" ? "text-pietro" : "text-ana";

  return (
    <Card className={cn("relative overflow-hidden border-2", isActive && "ring-2 ring-primary/30")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{profile.emoji}</span>
            <CardTitle className="font-display">{profile.name}</CardTitle>
          </div>
          <div className={cn("flex size-10 items-center justify-center rounded-full font-display text-sm font-bold text-white", accent)}>
            Lv {level}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{xpInLevel} / {xpForNext} XP</span>
            <span>Nível {level + 1}</span>
          </div>
          <Progress value={(xpInLevel / xpForNext) * 100} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<Flame className="size-4" />} label="XP total" value={totalXp} accent={text} />
          <Stat icon={<Footprints className="size-4" />} label="Km totais" value={totalKm.toFixed(1)} accent={text} />
          <Stat icon={<Activity className="size-4" />} label="Corridas" value={valid} accent={text} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className={cn("flex items-center gap-1 text-xs", accent)}>{icon}<span className="font-medium">{label}</span></div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

/* ────────────── Add Run ────────────── */

function AddRunDialog({ active, onAdded }: { active: Profile; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(isoDate(new Date()));
  const [km, setKm] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const kmNum = parseFloat(km.replace(",", "."));
  const xpPreview = Number.isFinite(kmNum) ? xpFromKm(kmNum) : 0;

  const submit = async () => {
    if (!Number.isFinite(kmNum) || kmNum <= 0) return;
    setSaving(true);
    try {
      await addRun({
        profile_slug: active.slug,
        date,
        distance_km: kmNum,
        duration_min: duration ? parseInt(duration, 10) : null,
        notes: notes || null,
      });
      toast.success(`Corrida registrada! +${xpFromKm(kmNum)} XP`);
      setKm(""); setDuration(""); setNotes("");
      setOpen(false);
      onAdded();
    } catch (e) {
      toast.error("Não foi possível salvar");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg">
          <Plus className="size-4" /> Nova corrida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="mr-2">{active.emoji}</span>Nova corrida — {active.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="km">Distância (km)</Label>
              <Input id="km" inputMode="decimal" placeholder="5.0" value={km} onChange={(e) => setKm(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="dur">Duração (min) — opcional</Label>
            <Input id="dur" inputMode="numeric" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="notes">Notas — opcional</Label>
            <Textarea id="notes" rows={2} placeholder="Sensações, ritmo..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className={cn(
            "rounded-xl border p-3 text-sm",
            xpPreview > 0 ? "border-success/40 bg-success/10" : "border-dashed text-muted-foreground"
          )}>
            {xpPreview > 0 ? (
              <span><Flame className="mr-1 inline size-4 text-primary" /> Vai render <b>{xpPreview} XP</b></span>
            ) : (
              <span>Corridas de menos de {MIN_KM} km não pontuam, mas ficam no histórico.</span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !Number.isFinite(kmNum) || kmNum <= 0}>
            {saving ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────── Contributions ────────────── */

function ContributionsCalendar({ profile, runs }: { profile: Profile; runs: Run[] }) {
  const WEEKS = 16;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfThisWeek = weekStart(today);
  const start = new Date(startOfThisWeek);
  start.setDate(start.getDate() - 7 * (WEEKS - 1));

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of runs) {
      const km = Number(r.distance_km);
      map.set(r.date, (map.get(r.date) ?? 0) + km);
    }
    return map;
  }, [runs]);

  const cells: Array<{ date: string; km: number; future: boolean }>[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: Array<{ date: string; km: number; future: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + w * 7 + d);
      const iso = isoDate(dt);
      week.push({ date: iso, km: byDate.get(iso) ?? 0, future: dt > today });
    }
    cells.push(week);
  }

  const intensity = (km: number) => {
    if (km <= 0) return 0;
    if (km < MIN_KM) return 1;
    if (km < 5) return 2;
    if (km < 8) return 3;
    return 4;
  };

  const colorBase = profile.slug === "pietro" ? "var(--color-pietro)" : "var(--color-ana)";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <span>{profile.emoji}</span> {profile.name} — últimas {WEEKS} semanas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-[3px]">
            {cells.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell) => {
                  const lvl = intensity(cell.km);
                  const opacity = cell.future ? 0 : [0.08, 0.3, 0.55, 0.8, 1][lvl];
                  return (
                    <div
                      key={cell.date}
                      title={`${formatBR(cell.date)} — ${cell.km.toFixed(1)} km`}
                      className="size-3.5 rounded-[3px] border border-border/40"
                      style={{
                        backgroundColor: cell.future ? "transparent" : `color-mix(in oklch, ${colorBase} ${opacity * 100}%, transparent)`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>menos</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className="size-3 rounded-[3px] border border-border/40"
              style={{
                backgroundColor: `color-mix(in oklch, ${colorBase} ${[8, 30, 55, 80, 100][lvl]}%, transparent)`,
              }}
            />
          ))}
          <span>mais</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────── Runs List ────────────── */

function RunsList({ runs, profiles, activeSlug, onChanged }: { runs: Run[]; profiles: Profile[]; activeSlug: string | null; onChanged: () => void }) {
  const delMut = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => { toast.success("Corrida removida"); onChanged(); },
    onError: () => toast.error("Erro ao remover"),
  });

  if (runs.length === 0) {
    return <EmptyState text="Nenhuma corrida ainda. Aperta o botão e bora!" />;
  }
  return (
    <div className="space-y-2">
      {runs.slice(0, 50).map((r) => {
        const p = profiles.find((x) => x.slug === r.profile_slug);
        const xp = xpFromKm(Number(r.distance_km));
        return (
          <div key={r.id} className={cn(
            "flex items-center gap-3 rounded-xl border bg-card p-3",
            p?.slug === "pietro" ? "border-l-4 border-l-pietro" : "border-l-4 border-l-ana"
          )}>
            <div className="text-xl">{p?.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {p?.name}
                <span className="text-xs font-normal text-muted-foreground">· {formatBR(r.date)}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {Number(r.distance_km).toFixed(2)} km{r.duration_min ? ` · ${r.duration_min} min` : ""}{r.notes ? ` · ${r.notes}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className={cn("font-display text-lg font-bold", xp === 0 && "text-muted-foreground")}>
                {xp > 0 ? `+${xp}` : "—"}
              </div>
              <div className="text-[10px] uppercase text-muted-foreground">XP</div>
            </div>
            {activeSlug === r.profile_slug && (
              <Button size="icon" variant="ghost" onClick={() => delMut.mutate(r.id)}>
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────── Photos ────────────── */

function PhotosSection({ profiles, photos, activeSlug, onChanged }: { profiles: Profile[]; photos: Photo[]; activeSlug: string; onChanged: () => void }) {
  const active = profiles.find((p) => p.slug === activeSlug);
  const ws = isoDate(weekStart(new Date()));
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setUploading(true);
    try {
      await uploadPhoto(file, active.slug, ws, caption);
      toast.success("Foto enviada!");
      setCaption("");
      onChanged();
    } catch (err) {
      console.error(err);
      toast.error("Falha no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const delMut = useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => { toast.success("Foto removida"); onChanged(); },
  });

  return (
    <div className="space-y-6">
      {active && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Legenda da semana ({formatBR(ws)})</Label>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Como foi a semana?" />
            </div>
            <label className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90",
              uploading && "pointer-events-none opacity-60"
            )}>
              <Upload className="size-4" />
              {uploading ? "Enviando..." : "Foto da semana"}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
            </label>
          </CardContent>
        </Card>
      )}
      {profiles.map((p) => {
        const list = photos.filter((ph) => ph.profile_slug === p.slug);
        return (
          <div key={p.slug}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">{p.emoji}</span>
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <span className="text-xs text-muted-foreground">{list.length} fotos</span>
            </div>
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Sem fotos ainda
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {list.map((ph) => (
                  <figure key={ph.id} className="group relative overflow-hidden rounded-xl border bg-card">
                    <img src={ph.url} alt={ph.caption ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                      <div className="font-semibold">{formatBR(ph.week_start)}</div>
                      {ph.caption && <div className="truncate opacity-90">{ph.caption}</div>}
                    </figcaption>
                    {activeSlug === p.slug && (
                      <button
                        onClick={() => delMut.mutate(ph.id)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remover foto"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
