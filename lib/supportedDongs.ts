import supportedDongsData from "@/data/supported-dongs.json";

export const SUPPORTED_DONGS = supportedDongsData as readonly string[];

export type SupportedDong = string;

export function isSupportedDong(value: string): value is SupportedDong {
  return SUPPORTED_DONGS.includes(value);
}
