/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Course } from "@/types/index";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";

interface CourseMapProps {
  course: Course;
  showToilets: boolean;
  showParkEntrances: boolean;
}

export default function CourseMap({
  course,
  showToilets,
  showParkEntrances,
}: CourseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const toiletMarkersRef = useRef<google.maps.Marker[]>([]);
  const entranceMarkersRef = useRef<google.maps.Marker[]>([]);
  const openInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        disableDefaultUI: true,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID",
      });
      mapInstanceRef.current = map;
      setMapLoaded(true);

      const path = google.maps.geometry.encoding.decodePath(course.polyline);
      const polyline = new google.maps.Polyline({
        path,
        strokeColor: "#2A6B35",
        strokeWeight: 4,
        map,
      });

      const bounds = new google.maps.LatLngBounds();
      polyline.getPath().forEach((latlng) => bounds.extend(latlng));
      map.fitBounds(bounds, { bottom: window.innerHeight * 0.4 });

      // Toilet markers — start hidden; toggle effects control visibility
      toiletMarkersRef.current = course.facilities.toilets.map((toilet) => {
        const marker = new google.maps.Marker({
          position: { lat: toilet.lat, lng: toilet.lng },
          map: null,
          title: toilet.name,
          icon: {
            url: "/icons/toilet.svg",
            scaledSize: new google.maps.Size(32, 32),
          },
        });
        marker.addListener("click", () => {
          openInfoWindowRef.current?.close();
          const iw = new google.maps.InfoWindow({
            content: `<div style="font-family: Manrope, sans-serif; font-size: 13px; padding: 4px 8px;">${toilet.name}</div>`,
          });
          iw.open(map, marker);
          openInfoWindowRef.current = iw;
        });
        return marker;
      });

      // Park entrance markers — start hidden
      entranceMarkersRef.current = course.facilities.park_entrances.map(
        (entrance) => {
          const marker = new google.maps.Marker({
            position: { lat: entrance.lat, lng: entrance.lng },
            map: null,
            title: entrance.name,
            icon: {
              url: "/icons/park-entrance.svg",
              scaledSize: new google.maps.Size(32, 32),
            },
          });
          marker.addListener("click", () => {
            openInfoWindowRef.current?.close();
            const iw = new google.maps.InfoWindow({
              content: `<div style="font-family: Manrope, sans-serif; font-size: 13px; padding: 4px 8px;">${entrance.name}</div>`,
            });
            iw.open(map, marker);
            openInfoWindowRef.current = iw;
          });
          return marker;
        }
      );

      // 생성 직후 현재 토글 상태 반영
      toiletMarkersRef.current.forEach((m) => m.setMap(showToilets ? map : null));
      entranceMarkersRef.current.forEach((m) => m.setMap(showParkEntrances ? map : null));
    });

    return () => {
      cancelled = true;
    };
  }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapInstanceRef.current;
    toiletMarkersRef.current.forEach((m) => m.setMap(showToilets ? map : null));
    if (!showToilets) openInfoWindowRef.current?.close();
  }, [showToilets, mapLoaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    entranceMarkersRef.current.forEach((m) =>
      m.setMap(showParkEntrances ? map : null)
    );
    if (!showParkEntrances) openInfoWindowRef.current?.close();
  }, [showParkEntrances, mapLoaded]);

  return (
    <div className="w-full h-full bg-surface-container relative">
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
