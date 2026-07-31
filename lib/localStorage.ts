const RECENT_KEY = "today-path-recent";
const FAVORITES_KEY = "today-path-favorites";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function getRecentCourses(): string[] {
  return read(RECENT_KEY);
}

export function addRecentCourse(id: string): void {
  if (typeof window === "undefined") return;
  const recent = read(RECENT_KEY).filter((r) => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function getFavorites(): string[] {
  return read(FAVORITES_KEY);
}

export function toggleFavorite(id: string): void {
  if (typeof window === "undefined") return;
  const favs = read(FAVORITES_KEY);
  const next = favs.includes(id)
    ? favs.filter((f) => f !== id)
    : [...favs, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
}

export function isFavorite(id: string): boolean {
  return read(FAVORITES_KEY).includes(id);
}
