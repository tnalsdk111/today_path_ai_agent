/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoaded?: boolean;
    __googleMapsCallbacks?: Array<() => void>;
  }
}

/** Google Maps JS API를 한 번만 로드하고, 이후 호출은 같은 Promise를 공유한다. */
export function loadGoogleMaps(apiKey: string): Promise<void> {
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
