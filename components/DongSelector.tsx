"use client";

import { useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";

const DONG_LIST = [
  "풍덕천1동",
  "풍덕천2동",
  "신봉동",
  "죽전1동",
  "죽전2동",
  "상현1동",
  "상현2동",
  "성복동",
  "동천동",
];

export default function DongSelector() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dong = useFilterStore((s) => s.dong);
  const setDong = useFilterStore((s) => s.setDong);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(name: string) {
    setDong(name);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-sm">
      <h3 className="text-h3 font-h3 text-on-surface">어디서 산책할까요?</h3>

      <div ref={containerRef} className="relative w-full">
        {/* 드롭다운 버튼 */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex justify-between items-center bg-surface-container-lowest rounded-lg px-md py-sm"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <span
            className={`text-body-lg font-body-lg font-medium ${
              dong ? "text-on-surface" : "text-on-surface-variant"
            }`}
          >
            {dong ?? "동을 선택하세요"}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            {open ? "expand_less" : "expand_more"}
          </span>
        </button>

        {/* 드롭다운 목록 */}
        {open && (
          <ul
            className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-lg z-10 overflow-hidden"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {DONG_LIST.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`w-full text-left px-md py-sm text-body-lg font-body-lg hover:bg-surface-container ${
                    dong === name ? "text-primary font-semibold" : "text-on-surface"
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
