import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Btn({
  tone = "ink",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "line" | "ghost" | "stamp" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 px-4 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        tone === "ink" && "bg-ink text-paper",
        tone === "line" && "border border-line bg-sheet text-ink",
        tone === "ghost" && "text-ink",
        tone === "stamp" && "bg-stamp text-paper",
        className,
      )}
      {...props}
    />
  );
}

export const fieldClass =
  "h-12 w-full border border-line bg-sheet px-3 text-base text-ink outline-none focus:border-ink";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {children}
    </label>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-line bg-sheet px-3 py-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 text-xl font-medium leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}
