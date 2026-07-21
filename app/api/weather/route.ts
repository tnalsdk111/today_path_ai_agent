import { NextResponse } from "next/server";
import { WeatherData } from "@/types/index";
import { MOCK_WEATHER } from "@/lib/mockWeather";

export const dynamic = "force-dynamic";

const KMA_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const NX = 62;
const NY = 121;

const AIR_URL =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";
const AIR_STATION = "수지";

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function getBaseDateTime(): { base_date: string; base_time: string } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const currentMinutes = hours * 60 + minutes;

  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23].map((h) => h * 60);

  let selectedBase = baseTimes[0];
  for (const bt of baseTimes) {
    if (currentMinutes >= bt + 10) {
      selectedBase = bt;
    }
  }

  const baseHour = Math.floor(selectedBase / 60);
  const base_time = String(baseHour).padStart(2, "0") + "00";

  if (currentMinutes < 2 * 60 + 10) {
    const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
    return { base_date: formatDate(yesterday), base_time: "2300" };
  }

  return { base_date: formatDate(kst), base_time };
}

function gradeToAirGrade(grade: number): WeatherData["air"]["pm10_grade"] {
  if (grade === 1) return "좋음";
  if (grade === 2) return "보통";
  if (grade === 3) return "나쁨";
  if (grade === 4) return "매우나쁨";
  return "보통";
}

async function fetchAirKorea(): Promise<Partial<WeatherData["air"]>> {
  const params = new URLSearchParams({
    returnType: "json",
    numOfRows: "1",
    pageNo: "1",
    stationName: AIR_STATION,
    dataTerm: "DAILY",
    ver: "1.3",
  });

  const res = await fetch(
    `${AIR_URL}?serviceKey=${process.env.AIR_KOREA_API_KEY}&${params}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`AirKorea API error: ${res.status}`);

  const json = await res.json();
  const item = json.response.body.items[0];

  const pm10 = parseInt(item.pm10Value) || 0;
  const pm25 = parseInt(item.pm25Value) || 0;
  const pm10_grade = gradeToAirGrade(parseInt(item.pm10Grade1h));
  const pm25_grade = gradeToAirGrade(parseInt(item.pm25Grade1h));

  return { pm10, pm10_grade, pm25, pm25_grade };
}

async function fetchKmaWeather(): Promise<Partial<WeatherData["weather"]>> {
  const { base_date, base_time } = getBaseDateTime();
  const serviceKey = process.env.KMA_API_KEY;
  if (!serviceKey) throw new Error("KMA_API_KEY is not configured");

  const params = new URLSearchParams({
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date,
    base_time,
    nx: String(NX),
    ny: String(NY),
  });

  const res = await fetch(
    `${KMA_URL}?serviceKey=${serviceKey}&${params}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`KMA API error: ${res.status}`);

  const json = await res.json();
  const items: Array<{
    category: string;
    fcstValue: string;
    fcstDate: string;
    fcstTime: string;
  }> = json.response.body.items.item;

  const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const nowStr =
    formatDate(kstNow) +
    String(kstNow.getUTCHours()).padStart(2, "0") +
    "00";

  const getNearest = (category: string): string | null => {
    const filtered = items
      .filter((i) => i.category === category)
      .sort((a, b) => {
        const aTime = a.fcstDate + a.fcstTime;
        const bTime = b.fcstDate + b.fcstTime;
        const aDiff = Math.abs(parseInt(aTime) - parseInt(nowStr));
        const bDiff = Math.abs(parseInt(bTime) - parseInt(nowStr));
        return aDiff - bDiff;
      });
    return filtered[0]?.fcstValue ?? null;
  };

  const tmpVal = getNearest("TMP");
  const ptyVal = getNearest("PTY");
  const skyVal = getNearest("SKY");

  const temp = tmpVal ? Math.round(parseFloat(tmpVal)) : 0;
  const pty = ptyVal ? parseInt(ptyVal) : 0;
  const sky = skyVal ? parseInt(skyVal) : 1;

  const is_raining = [1, 2, 4].includes(pty);

  let condition: WeatherData["weather"]["condition"] = "맑음";
  if (pty >= 1) {
    condition = pty === 3 ? "눈" : "비";
  } else {
    if (sky === 1) condition = "맑음";
    else if (sky === 3) condition = "구름많음";
    else if (sky === 4) condition = "흐림";
  }

  return { temp, feels_like: temp, condition, is_raining };
}

export async function GET() {
  const [kmaResult, airResult] = await Promise.allSettled([
    fetchKmaWeather(),
    fetchAirKorea(),
  ]);

  if (kmaResult.status === "rejected")
    console.error("기상청 API 호출 실패:", kmaResult.reason);
  if (airResult.status === "rejected")
    console.error("에어코리아 API 호출 실패:", airResult.reason);

  const weather =
    kmaResult.status === "fulfilled" ? kmaResult.value : {};
  const air =
    airResult.status === "fulfilled" ? airResult.value : {};

  const data: WeatherData = {
    ...MOCK_WEATHER,
    updated_at: new Date().toISOString(),
    weather: {
      temp: weather.temp ?? MOCK_WEATHER.weather.temp,
      feels_like: weather.feels_like ?? MOCK_WEATHER.weather.feels_like,
      condition: weather.condition ?? MOCK_WEATHER.weather.condition,
      is_raining: weather.is_raining ?? MOCK_WEATHER.weather.is_raining,
    },
    air: {
      pm10: air.pm10 ?? MOCK_WEATHER.air.pm10,
      pm10_grade: air.pm10_grade ?? MOCK_WEATHER.air.pm10_grade,
      pm25: air.pm25 ?? MOCK_WEATHER.air.pm25,
      pm25_grade: air.pm25_grade ?? MOCK_WEATHER.air.pm25_grade,
    },
  };

  return NextResponse.json(data);
}
