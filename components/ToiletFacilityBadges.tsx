import { ToiletFacility } from "@/types/index";

interface ToiletFacilityBadgesProps {
  toilet: Pick<ToiletFacility, "accessible" | "children" | "emergency_bell">;
}

export function ToiletFacilityBadges({ toilet }: ToiletFacilityBadgesProps) {
  const badges: { symbol: string; label: string }[] = [];
  if (toilet.accessible) badges.push({ symbol: "♿", label: "장애인용" });
  if (toilet.children) badges.push({ symbol: "👶", label: "어린이용" });
  if (toilet.emergency_bell) badges.push({ symbol: "🔔", label: "비상벨" });

  if (badges.length === 0) return null;

  return (
    <span className="flex items-center gap-1 shrink-0" aria-label={badges.map((b) => b.label).join(", ")}>
      {badges.map((b) => (
        <span key={b.label} title={b.label} aria-hidden="true">
          {b.symbol}
        </span>
      ))}
    </span>
  );
}
