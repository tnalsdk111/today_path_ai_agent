/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Course } from "@/types/index";
import { createWcMapMarkerContent } from "@/lib/createWcMapMarker";

interface CourseMapProps {
  course: Course;
}

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoaded?: boolean;
    __googleMapsCallbacks?: Array<() => void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.maps?.geometry) {
      resolve();
      return;
    }

    if (!window.__googleMapsCallbacks) {
      window.__googleMapsCallbacks = [];
    }
    window.__googleMapsCallbacks.push(resolve);

    if (window.__googleMapsLoaded) return;
    window.__googleMapsLoaded = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker&callback=__googleMapsReady`;
    script.async = true;
    script.defer = true;

    (window as unknown as Record<string, unknown>)["__googleMapsReady"] = () => {
      window.__googleMapsCallbacks?.forEach((cb) => cb());
      window.__googleMapsCallbacks = [];
    };

    document.head.appendChild(script);
  });
}

export default function CourseMap({ course }: CourseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        disableDefaultUI: true,
        zoomControl: true,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID",
      });
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
      map.fitBounds(bounds);

      course.facilities.toilets.forEach((toilet) => {
        new google.maps.marker.AdvancedMarkerElement({
          position: { lat: toilet.lat, lng: toilet.lng },
          map,
          title: toilet.name,
          content: createWcMapMarkerContent(toilet.name),
        });
      });

      course.facilities.park_entrances.forEach((entrance) => {
        new google.maps.marker.AdvancedMarkerElement({
          position: { lat: entrance.lat, lng: entrance.lng },
          map,
          title: entrance.name,
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [course]);

  return (
    <div className="w-full h-[240px] bg-surface-container relative">
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
