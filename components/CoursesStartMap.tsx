/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Course } from "@/types/index";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";

interface CoursesStartMapProps {
  courses: Course[];
}

const START_MARKER_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path fill="#0c521f" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>`
);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function CoursesStartMap({ courses }: CoursesStartMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const openInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const coursesKey = courses.map((c) => c.id).join(",");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current || courses.length === 0) return;
    let cancelled = false;

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !mapRef.current) return;

      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      openInfoWindowRef.current?.close();

      const map =
        mapInstanceRef.current ??
        new google.maps.Map(mapRef.current, {
          disableDefaultUI: true,
          zoomControl: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID",
          gestureHandling: "cooperative",
        });
      mapInstanceRef.current = map;
      setMapLoaded(true);

      const bounds = new google.maps.LatLngBounds();

      markersRef.current = courses.map((course) => {
        const position = {
          lat: course.start_point.lat,
          lng: course.start_point.lng,
        };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map,
          title: course.name,
          icon: {
            url: `data:image/svg+xml,${START_MARKER_SVG}`,
            scaledSize: new google.maps.Size(28, 35),
            anchor: new google.maps.Point(14, 35),
          },
        });

        marker.addListener("click", () => {
          openInfoWindowRef.current?.close();
          const iw = new google.maps.InfoWindow({
            content: `<div style="font-family: Pretendard, Manrope, sans-serif; font-size: 13px; font-weight: 600; color: #191d18; padding: 2px 4px; max-width: 160px; line-height: 1.3;">${escapeHtml(course.name)}</div>`,
          });
          iw.open(map, marker);
          openInfoWindowRef.current = iw;
        });

        return marker;
      });

      if (courses.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 48);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [coursesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="w-full h-[220px] rounded-xl overflow-hidden bg-surface-container relative"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-on-surface-variant font-body-md text-body-md">
            지도 준비 중
          </span>
        </div>
      )}
    </div>
  );
}
