import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fitness/Dashboard";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunDuo — Pietro & Ana Beatriz" },
      { name: "description", content: "Acompanhe a evolução fitness do casal: corridas, XP, ranking e conquistas." },
      { property: "og:title", content: "RunDuo — Pietro & Ana Beatriz" },
      { property: "og:description", content: "Corridas, XP, conquistas e calendário do casal." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Dashboard />
      <Toaster position="top-center" richColors />
    </>
  );
}
