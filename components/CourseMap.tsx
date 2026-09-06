/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Course } from "@/types/index";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import {
  createParkEntranceMapMarkerContent,
  createWcMapMarkerContent,
} from "@/lib/createWcMapMarker";

const START_MARKER_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path fill="#0c521f" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>`
);

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
  const pathBoundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const toiletMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const entranceMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
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
      const startPosition = {
        lat: course.start_point.lat,
        lng: course.start_point.lng,
      };
      bounds.extend(startPosition);
      pathBoundsRef.current = bounds;
      map.fitBounds(bounds, { bottom: window.innerHeight * 0.4 });

      const startMarker = new google.maps.Marker({
        position: startPosition,
        map,
        title: "출발점",
        zIndex: 10,
        icon: {
          url: `data:image/svg+xml,${START_MARKER_SVG}`,
          scaledSize: new google.maps.Size(28, 35),
          anchor: new google.maps.Point(14, 35),
        },
      });
      startMarker.addListener("click", () => {
        openInfoWindowRef.current?.close();
        const iw = new google.maps.InfoWindow({
          content: `<div style="font-family: Pretendard, Manrope, sans-serif; font-size: 13px; font-weight: 600; color: #191d18; padding: 2px 4px;">출발점</div>`,
        });
        iw.open(map, startMarker);
        openInfoWindowRef.current = iw;
      });

      toiletMarkersRef.current = course.facilities.toilets.map((toilet) => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: toilet.lat, lng: toilet.lng },
          map: showToilets ? map : null,
          title: toilet.name,
          content: createWcMapMarkerContent(toilet.name),
          gmpClickable: true,
          zIndex: 8,
        });
        marker.addEventListener("gmp-click", () => {
          openInfoWindowRef.current?.close();
          const iw = new google.maps.InfoWindow({
            content: `<div style="font-family: Manrope, sans-serif; font-size: 13px; padding: 4px 8px;">${toilet.name}</div>`,
          });
          iw.open({ map, anchor: marker });
          openInfoWindowRef.current = iw;
        });
        return marker;
      });

      entranceMarkersRef.current = course.facilities.park_entrances.map(
        (entrance) => {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: entrance.lat, lng: entrance.lng },
            map: showParkEntrances ? map : null,
            title: entrance.name,
            content: createParkEntranceMapMarkerContent(entrance.name),
            gmpClickable: true,
            zIndex: 8,
          });
          marker.addEventListener("gmp-click", () => {
            openInfoWindowRef.current?.close();
            const iw = new google.maps.InfoWindow({
              content: `<div style="font-family: Manrope, sans-serif; font-size: 13px; padding: 4px 8px;">${entrance.name}</div>`,
            });
            iw.open({ map, anchor: marker });
            openInfoWindowRef.current = iw;
          });
          return marker;
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapInstanceRef.current;
    toiletMarkersRef.current.forEach((m) => {
      m.map = showToilets ? map : null;
    });
    if (!showToilets) openInfoWindowRef.current?.close();
    if (showToilets && map && toiletMarkersRef.current.length > 0) {
      const bounds = pathBoundsRef.current
        ? new google.maps.LatLngBounds(
            pathBoundsRef.current.getSouthWest(),
            pathBoundsRef.current.getNorthEast(),
          )
        : new google.maps.LatLngBounds();
      toiletMarkersRef.current.forEach((m) => {
        if (m.position) bounds.extend(m.position);
      });
      map.fitBounds(bounds, { bottom: window.innerHeight * 0.4 });
    }
  }, [showToilets, mapLoaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    entranceMarkersRef.current.forEach((m) => {
      m.map = showParkEntrances ? map : null;
    });
    if (!showParkEntrances) openInfoWindowRef.current?.close();
    if (showParkEntrances && map && entranceMarkersRef.current.length > 0) {
      const bounds = pathBoundsRef.current
        ? new google.maps.LatLngBounds(
            pathBoundsRef.current.getSouthWest(),
            pathBoundsRef.current.getNorthEast(),
          )
        : new google.maps.LatLngBounds();
      entranceMarkersRef.current.forEach((m) => {
        if (m.position) bounds.extend(m.position);
      });
      map.fitBounds(bounds, { bottom: window.innerHeight * 0.4 });
    }
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
