import { NextResponse } from "next/server";
import { getWeatherData } from "@/lib/getWeatherData";

export const revalidate = 600;

export async function GET() {
  try {
    const data = await getWeatherData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=600, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "weather unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
