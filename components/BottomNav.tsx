"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV_TABS: { icon: string; label: string; href: string; activeFor: string | null }[] = [
  { icon: "map", label: "추천", href: "/", activeFor: "/" },
  { icon: "explore", label: "탐색", href: "/discovery", activeFor: "/discovery" },
  { icon: "route", label: "내 경로", href: "/my-routes", activeFor: "/my-routes" },
  { icon: "person", label: "프로필", href: "/profile", activeFor: "/profile" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex justify-around items-center px-4 pb-4 pt-2 font-label-sm text-label-sm max-w-[390px] mx-auto right-0">
      {NAV_TABS.map(({ icon, label, href, activeFor }) => {
        const active = activeFor !== null && pathname === activeFor;
        return (
          <button
            key={label}
            type="button"
            onClick={() => router.push(href)}
            className={
              active
                ? "flex flex-col items-center gap-0.5 bg-secondary-container text-primary rounded-full px-4 py-1"
                : "flex flex-col items-center gap-0.5 text-secondary p-2"
            }
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
