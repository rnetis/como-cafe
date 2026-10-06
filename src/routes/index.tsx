import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/components/como/desk";
import { ComoMark } from "@/components/como/logo";
import { useCafe } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useCafe.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return useCafe.persist.onFinishHydration(() => setReady(true));
  }, []);

  if (!ready) return <Boot />;
  return <Desk />;
}

function Boot() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-paper px-6 py-8 text-ink">
      <div>
        <ComoMark className="h-24 w-9" />
        <p className="mt-6 font-display text-4xl tracking-wide">COMO</p>
        <p className="mt-2 text-sm text-mute">Est. 2026 · Bandar Abbas</p>
      </div>
      <p className="max-w-xs font-display text-2xl italic leading-snug">
        Coffee isn't just a drink. It's a pause.
      </p>
      <p className="text-xs tracking-widest text-mute">COFFEE. PEOPLE. MOMENTS.</p>
    </main>
  );
}
