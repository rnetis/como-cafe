import { cn } from "@/lib/cn";

export function ComoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 240" className={cn("h-16 w-6 text-ink", className)} aria-hidden="true">
      <rect x="1" y="1" width="54" height="214" rx="8" fill="currentColor" />
      <g fill="var(--color-paper)" fontFamily="Vazirmatn, DejaVu Sans, sans-serif" fontWeight="800" fontSize="34">
        <text x="28" y="50" textAnchor="middle">
          C
        </text>
        <text x="28" y="96" textAnchor="middle">
          O
        </text>
        <text x="28" y="142" textAnchor="middle">
          M
        </text>
        <text x="28" y="188" textAnchor="middle">
          O
        </text>
      </g>
      <circle cx="62" cy="222" r="7" fill="currentColor" />
    </svg>
  );
}
