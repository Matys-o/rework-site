import { cn } from "../lib/cn";

// Logotype — Bricolage Grotesque ExtraBold, approche −6 %, le ° en rouge signal
export function Logo({ className, ton = "encre" }: { className?: string; ton?: "encre" | "papier" }) {
  return (
    <span
      className={cn(
        "font-display font-extrabold leading-none tracking-[-0.06em] [font-variation-settings:'opsz'_96]",
        ton === "encre" ? "text-encre" : "text-papier",
        className,
      )}
    >
      rework<span className="text-signal">°</span>
    </span>
  );
}
