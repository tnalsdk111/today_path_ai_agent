"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  discoveryVideos,
  getYoutubeThumbnailUrl,
  type DiscoveryVideo,
  type VideoTag,
} from "./videoData";

type FilterValue = "전체" | VideoTag;

const FILTER_OPTIONS: FilterValue[] = ["전체", "건강", "산책로", "노래"];

const NAV_TABS = [
  { icon: "map", label: "추천", href: "/", active: false },
  { icon: "explore", label: "탐색", href: "/discovery", active: true },
  { icon: "route", label: "내 경로", href: "#", active: false },
  { icon: "person", label: "프로필", href: "#", active: false },
];

const TAG_CHIP_CLASS: Record<VideoTag, string> = {
  건강: "bg-[#EAF3EC] text-primary",
  산책로: "bg-secondary-container text-primary-container",
  노래: "bg-[#E3F0FF] text-[#1A4D8F]",
};

function filterChipClass(active: boolean): string {
  const base =
    "shrink-0 rounded-full px-md py-1.5 font-body-md text-body-md transition-transform active:scale-95";
  return active
    ? `${base} bg-primary text-on-primary`
    : `${base} bg-surface-container-lowest border border-outline-variant text-on-surface-variant`;
}

function VideoCard({ video }: { video: DiscoveryVideo }) {
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface-container-lowest rounded-xl overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="relative w-full aspect-video bg-surface-container">
        <img
          src={getYoutubeThumbnailUrl(video.youtubeId)}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-md flex flex-col gap-xs">
        <h3 className="font-h3 text-h3 text-on-surface line-clamp-2">{video.title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">{video.channelName}</p>
        <span
          className={`self-start mt-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm ${TAG_CHIP_CLASS[video.tag]}`}
        >
          {video.tag}
        </span>
      </div>
    </a>
  );
}

export default function DiscoveryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("전체");

  const filteredVideos = useMemo(() => {
    if (activeFilter === "전체") return discoveryVideos;
    return discoveryVideos.filter((video) => video.tag === activeFilter);
  }, [activeFilter]);

  return (
    <div className="font-body-md text-on-surface bg-background">
      <div className="max-w-[390px] mx-auto relative min-h-screen pb-24">
        <header className="sticky top-0 z-50 bg-surface shadow-sm px-margin py-sm flex items-center">
          <div className="flex items-center gap-2 text-h2 font-h2 text-primary">
            <span className="material-symbols-outlined">explore</span>
            탐색
          </div>
        </header>

        <main className="px-margin pt-md pb-xl flex flex-col gap-md">
          <div className="flex gap-xs overflow-x-auto pb-1 -mx-margin px-margin">
            {FILTER_OPTIONS.map((option) => {
              const active = activeFilter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveFilter(option)}
                  className={filterChipClass(active)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {filteredVideos.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">
              해당 카테고리의 영상이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-md list-none p-0 m-0">
              {filteredVideos.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} />
                </li>
              ))}
            </ul>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex justify-around items-center px-4 pb-4 pt-2 font-label-sm text-label-sm max-w-[390px] mx-auto right-0">
          {NAV_TABS.map(({ icon, label, href, active }) =>
            href === "#" ? (
              <button
                key={label}
                type="button"
                className="flex flex-col items-center gap-0.5 text-secondary p-2"
              >
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
                {label}
              </button>
            ) : (
              <Link
                key={label}
                href={href}
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
              </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
