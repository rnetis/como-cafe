import { useEffect, useState } from "react";
import {
  BookOpen,
  Coffee,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { Toaster } from "sonner";
import { ComoMark } from "@/components/como/logo";
import { Books } from "@/components/como/books";
import { Cellar } from "@/components/como/cellar";
import { Guests } from "@/components/como/guests";
import { House } from "@/components/como/house";
import { Pos } from "@/components/como/pos";
import { ReceiptSheet } from "@/components/como/receipt-sheet";
import { Tickets } from "@/components/como/tickets";
import { Wire } from "@/components/como/wire";
import { cn } from "@/lib/cn";
import { formatCompact, startOfDay, tx } from "@/lib/format";
import { birthdaySoon, inSlowHour } from "@/lib/loyalty";
import { useCafe } from "@/lib/store";

type View = "desk" | "tickets" | "cellar" | "books" | "guests" | "wire" | "house";

const VIEWS: { id: View; icon: typeof Coffee; fa: string; en: string }[] = [
  { id: "desk", icon: Coffee, fa: "صندوق", en: "Desk" },
  { id: "tickets", icon: ScrollText, fa: "فیش", en: "Tickets" },
  { id: "cellar", icon: Package, fa: "انبار", en: "Cellar" },
  { id: "books", icon: BookOpen, fa: "دفتر", en: "Books" },
  { id: "guests", icon: Users, fa: "مهمان", en: "Guests" },
  { id: "wire", icon: MessageSquare, fa: "پیامک", en: "SMS" },
  { id: "house", icon: Settings, fa: "خانه", en: "House" },
];

export function Desk() {
  const [view, setView] = useState<View>("desk");
  const [now, setNow] = useState(() => Date.now());
  const lang = useCafe((state) => state.settings.lang);
  const settings = useCafe((state) => state.settings);
  const orders = useCafe((state) => state.orders);
  const stock = useCafe((state) => state.stock);
  const customers = useCafe((state) => state.customers);
  const patchSettings = useCafe((state) => state.patchSettings);

  useEffect(() => {
    document.documentElement.lang = lang === "fa" ? "fa" : "en";
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // An open tab is not today's money yet — only closed tickets count.
  const today = orders
    .filter((order) => order.status === "closed" && order.at >= startOfDay(now))
    .reduce((sum, order) => sum + order.total, 0);
  const openTickets = orders.filter((order) => order.status === "open").length;
  const low = stock.some((item) => item.onHand < item.par);
  const birthdays = customers.some((guest) => birthdaySoon(guest.birthday));
  const slow = inSlowHour(now, settings.slowStart, settings.slowEnd);
  const clock = new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-e border-line bg-sheet md:flex">
        <div className="flex items-start gap-3 px-4 py-5">
          <ComoMark />
          <div>
            <p className="font-display text-2xl leading-none">COMO</p>
            <p className="mt-1 text-xs tracking-widest text-mute">EST. 2026</p>
          </div>
        </div>
        <p className="px-4 text-xs text-mute">{tx(lang, settings.addressFa, settings.addressEn)}</p>
        <p className="mt-3 px-4 text-sm">
          <span className="text-mute">{tx(lang, "امروز", "Today")}</span>
          <span className="ms-2 font-medium">{formatCompact(today, lang)}</span>
        </p>
        {slow ? (
          <p className="mx-4 mt-3 border border-ink px-2 py-1 text-xs">
            {tx(lang, "ساعت آرام · امتیاز دو برابر", "Slow hour · double points")}
          </p>
        ) : null}
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
          {VIEWS.map((item) => (
            <NavButton
              key={item.id}
              active={view === item.id}
              label={tx(lang, item.fa, item.en)}
              icon={item.icon}
              alert={
                (item.id === "cellar" && low) ||
                (item.id === "guests" && birthdays) ||
                (item.id === "tickets" && openTickets > 0)
              }
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <LangToggle lang={lang} onChange={(next) => patchSettings({ lang: next })} />
          <p className="mt-4 text-xs tracking-widest text-mute">COFFEE. PEOPLE. MOMENTS.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <ComoMark className="h-10 w-4" />
            <div>
              <p className="text-sm font-medium leading-none">COMO</p>
              <p className="text-xs text-mute">{clock}</p>
            </div>
          </div>
          <LangToggle lang={lang} onChange={(next) => patchSettings({ lang: next })} />
        </header>
        <div className="hidden items-center justify-between border-b border-line px-6 py-3 md:flex">
          <p className="font-display text-lg italic">
            {tx(lang, "قهوه فقط یک نوشیدنی نیست. یک مکث است.", "Coffee isn't just a drink. It's a pause.")}
          </p>
          <p className="text-sm text-mute">{clock}</p>
        </div>
        <main className="px-4 py-4 pb-24 md:px-6 md:pb-8">
          {view === "desk" ? <Pos /> : null}
          {view === "tickets" ? <Tickets /> : null}
          {view === "cellar" ? <Cellar /> : null}
          {view === "books" ? <Books /> : null}
          {view === "guests" ? <Guests /> : null}
          {view === "wire" ? <Wire /> : null}
          {view === "house" ? <House /> : null}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-sheet md:hidden">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={cn(
              "relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs",
              view === item.id ? "text-ink" : "text-mute",
            )}
          >
            <item.icon className="size-5" strokeWidth={1.5} />
            {tx(lang, item.fa, item.en)}
            {(item.id === "cellar" && low) ||
            (item.id === "guests" && birthdays) ||
            (item.id === "tickets" && openTickets > 0) ? (
              <span className="absolute top-2 size-1.5 rounded-full bg-stamp" />
            ) : null}
          </button>
        ))}
      </nav>
      <ReceiptSheet />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-ink)",
            color: "var(--color-paper)",
            border: "none",
            borderRadius: 2,
          },
        }}
      />
    </div>
  );
}

function NavButton({
  active,
  label,
  icon: Icon,
  alert,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Coffee;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 px-3 text-sm",
        active ? "bg-ink text-paper" : "text-ink-soft",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} />
      <span className="flex-1 text-start">{label}</span>
      {alert ? <span className={cn("size-1.5 rounded-full", active ? "bg-paper" : "bg-stamp")} /> : null}
    </button>
  );
}

function LangToggle({ lang, onChange }: { lang: "fa" | "en"; onChange: (lang: "fa" | "en") => void }) {
  return (
    <div className="flex border border-line">
      {(["fa", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn("h-10 px-3 text-xs", lang === code ? "bg-ink text-paper" : "bg-sheet text-mute")}
        >
          {code === "fa" ? "فا" : "EN"}
        </button>
      ))}
    </div>
  );
}
