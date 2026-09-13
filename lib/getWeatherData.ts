import dns from "node:dns";
import { PollenLevel, WeatherData } from "@/types/index";
import { MOCK_WEATHER } from "@/lib/mockWeather";

dns.setDefaultResultOrder("ipv4first");

const KMA_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const NX = 62;
const NY = 121;
/** 수지구(성복·죽전 일대) */
const SUJI_LAT = 37.322;
const SUJI_LNG = 127.096;

const AIR_URL =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";
const AIR_STATION = "수지";

const POLLEN_URL =
  "https://apis.data.go.kr/1360000/HealthWthrIdxServiceV3";
/** 경기도 용인시 수지구 */
const POLLEN_AREA_NO = "4146500000";
const EMPTY_POLLEN: WeatherData["pollen"] = {
  pine: { status: "unavailable" },
  oak: { status: "unavailable" },
  grass: { status: "unavailable" },
};

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12000;
const KMA_TIMEOUT_MS = 3500;

type CacheEntry = { data: WeatherData; fetchedAt: number };

let cache: CacheEntry | null = null;
let inflight: Promise<WeatherData> | null = null;

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

function abortSignal(ms = FETCH_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
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
    { next: { revalidate: 600 }, signal: abortSignal(KMA_TIMEOUT_MS) }
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

function pm10ToGrade(value: number): WeatherData["air"]["pm10_grade"] {
  if (value <= 30) return "좋음";
  if (value <= 80) return "보통";
  if (value <= 150) return "나쁨";
  return "매우나쁨";
}

function pm25ToGrade(value: number): WeatherData["air"]["pm25_grade"] {
  if (value <= 15) return "좋음";
  if (value <= 35) return "보통";
  if (value <= 75) return "나쁨";
  return "매우나쁨";
}

function wmoToCondition(code: number): {
  condition: WeatherData["weather"]["condition"];
  is_raining: boolean;
} {
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { condition: "눈", is_raining: false };
  }
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      code,
    )
  ) {
    return { condition: "비", is_raining: true };
  }
  if (code === 0 || code === 1) return { condition: "맑음", is_raining: false };
  if (code === 2) return { condition: "구름많음", is_raining: false };
  return { condition: "흐림", is_raining: false };
}

async function fetchOpenMeteoWeather(): Promise<Partial<WeatherData["weather"]>> {
  const params = new URLSearchParams({
    latitude: String(SUJI_LAT),
    longitude: String(SUJI_LNG),
    current: "temperature_2m,apparent_temperature,weather_code,precipitation",
    timezone: "Asia/Seoul",
  });
  const res = await fetch(`${OPEN_METEO_FORECAST_URL}?${params}`, {
    next: { revalidate: 600 },
    signal: abortSignal(),
  });
  if (!res.ok) throw new Error(`Open-Meteo weather error: ${res.status}`);

  const json = await res.json();
  const current = json.current;
  if (current?.temperature_2m == null || current?.weather_code == null) {
    throw new Error("Open-Meteo weather missing current data");
  }

  const { condition, is_raining } = wmoToCondition(current.weather_code);
  const raining = is_raining || (current.precipitation ?? 0) > 0;
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature ?? current.temperature_2m);

  return { temp, feels_like: feels, condition, is_raining: raining };
}

async function fetchOpenMeteoAir(): Promise<Partial<WeatherData["air"]>> {
  const params = new URLSearchParams({
    latitude: String(SUJI_LAT),
    longitude: String(SUJI_LNG),
    current: "pm10,pm2_5",
    timezone: "Asia/Seoul",
  });
  const res = await fetch(`${OPEN_METEO_AIR_URL}?${params}`, {
    next: { revalidate: 600 },
    signal: abortSignal(),
  });
  if (!res.ok) throw new Error(`Open-Meteo air error: ${res.status}`);

  const json = await res.json();
  const current = json.current;
  if (current?.pm10 == null || current?.pm2_5 == null) {
    throw new Error("Open-Meteo air missing current data");
  }

  const pm10 = Math.round(current.pm10);
  const pm25 = Math.round(current.pm2_5);
  return {
    pm10,
    pm25,
    pm10_grade: pm10ToGrade(pm10),
    pm25_grade: pm25ToGrade(pm25),
  };
}

async function fetchKmaWeather(): Promise<Partial<WeatherData["weather"]>> {
  const { base_date, base_time } = getBaseDateTime();
  const serviceKey = process.env.KMA_API_KEY;
  if (!serviceKey) throw new Error("KMA_API_KEY is not configured");

  const params = new URLSearchParams({
    pageNo: "1",
    numOfRows: "200",
    dataType: "JSON",
    base_date,
    base_time,
    nx: String(NX),
    ny: String(NY),
  });

  const res = await fetch(`${KMA_URL}?serviceKey=${serviceKey}&${params}`, {
    next: { revalidate: 600 },
    signal: abortSignal(KMA_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`KMA API error: ${res.status}`);

  const json = await res.json();
  const items: Array<{
    category: string;
    fcstValue: string;
    fcstDate: string;
    fcstTime: string;
  }> = json.response?.body?.items?.item;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("KMA API returned no forecast items");
  }

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
  if (!tmpVal) throw new Error("KMA API missing TMP");

  const temp = Math.round(parseFloat(tmpVal));
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

function getPollenBaseTime(): string {
  const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  const currentMinutes = hours * 60 + minutes;
  // 06시·18시 발표. 직후 수 분은 아직 안 올라올 수 있어 여유를 둔다.
  if (currentMinutes >= 18 * 60 + 10) return formatDate(kst) + "18";
  if (currentMinutes >= 6 * 60 + 10) return formatDate(kst) + "06";
  const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
  return formatDate(yesterday) + "18";
}

function kstMonth(): number {
  const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  return kst.getUTCMonth() + 1;
}

/** 소나무·참나무 4~6월, 잡초류 8~10월 */
function isPollenSeason(kind: keyof WeatherData["pollen"]): boolean {
  const month = kstMonth();
  if (kind === "pine" || kind === "oak") return month >= 4 && month <= 6;
  return month >= 8 && month <= 10;
}

function pollenIndexToLevel(value: string | number | undefined): PollenLevel | null {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (n === 0) return "낮음";
  if (n === 1) return "보통";
  if (n === 2) return "높음";
  if (n === 3) return "매우높음";
  return null;
}

type PollenReading = WeatherData["pollen"]["pine"];

function pollenFallback(kind: keyof WeatherData["pollen"]): PollenReading {
  return isPollenSeason(kind)
    ? { status: "unavailable" }
    : { status: "off_season" };
}

async function fetchKmaPollenIndex(
  kind: keyof WeatherData["pollen"],
  operation: string,
): Promise<PollenReading> {
  const serviceKey = process.env.KMA_API_KEY;
  if (!serviceKey) return pollenFallback(kind);

  try {
    const params = new URLSearchParams({
      pageNo: "1",
      numOfRows: "10",
      dataType: "JSON",
      areaNo: POLLEN_AREA_NO,
      time: getPollenBaseTime(),
    });

    const res = await fetch(
      `${POLLEN_URL}/${operation}?serviceKey=${serviceKey}&${params}`,
      {
        next: { revalidate: 600 },
        signal: abortSignal(KMA_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `꽃가루 API HTTP ${res.status} (${kind}):`,
        body.slice(0, 300),
      );
      return pollenFallback(kind);
    }

    const json = await res.json();
    const gatewayErr =
      json.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnAuthMsg ??
      json.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
    if (gatewayErr) {
      console.error(`꽃가루 API 게이트웨이 오류 (${kind}):`, gatewayErr);
      return pollenFallback(kind);
    }

    const resultCode = String(json.response?.header?.resultCode ?? "");
    const reachedKma =
      resultCode === "00" || resultCode === "0" || resultCode === "03";
    if (!reachedKma) {
      console.error(
        `꽃가루 API resultCode=${resultCode || "없음"} (${kind})`,
        json.response?.header ?? json,
      );
      return pollenFallback(kind);
    }

    const raw = json.response?.body?.items?.item;
    const item = Array.isArray(raw) ? raw[0] : raw;
    const level = pollenIndexToLevel(item?.today);
    if (level) return { status: "ok", level };

    return pollenFallback(kind);
  } catch (err) {
    console.error(`꽃가루 API 호출 실패 (${kind}):`, err);
    return pollenFallback(kind);
  }
}

async function fetchKmaPollen(): Promise<WeatherData["pollen"]> {
  const [pine, oak, grass] = await Promise.all([
    fetchKmaPollenIndex("pine", "getPinePollenRiskIdxV3"),
    fetchKmaPollenIndex("oak", "getOakPollenRiskIdxV3"),
    fetchKmaPollenIndex("grass", "getWeedsPollenRiskndxV3"),
  ]);
  return { pine, oak, grass };
}

async function fetchWeatherWithFallback(): Promise<Partial<WeatherData["weather"]>> {
  const openMeteo = fetchOpenMeteoWeather();
  try {
    return await fetchKmaWeather();
  } catch (err) {
    console.error("기상청 날씨 실패, Open-Meteo 사용:", err);
    return await openMeteo;
  }
}

async function fetchAirWithFallback(): Promise<Partial<WeatherData["air"]>> {
  const openMeteo = fetchOpenMeteoAir();
  try {
    return await fetchAirKorea();
  } catch (err) {
    console.error("에어코리아 실패, Open-Meteo 사용:", err);
    return await openMeteo;
  }
}

async function fetchFreshWeather(): Promise<WeatherData> {
  const [weatherResult, airResult, pollenResult] = await Promise.allSettled([
    fetchWeatherWithFallback(),
    fetchAirWithFallback(),
    fetchKmaPollen(),
  ]);

  if (weatherResult.status === "rejected") {
    console.error("날씨 API 호출 실패:", weatherResult.reason);
    throw weatherResult.reason;
  }
  if (airResult.status === "rejected")
    console.error("대기질 API 호출 실패:", airResult.reason);
  if (pollenResult.status === "rejected")
    console.error("꽃가루 API 호출 실패:", pollenResult.reason);

  const weather = weatherResult.value;
  const air =
    airResult.status === "fulfilled" ? airResult.value : {};
  const pollen =
    pollenResult.status === "fulfilled" ? pollenResult.value : EMPTY_POLLEN;

  return {
    ...MOCK_WEATHER,
    updated_at: new Date().toISOString(),
    weather: {
      temp: weather.temp!,
      feels_like: weather.feels_like!,
      condition: weather.condition!,
      is_raining: weather.is_raining!,
    },
    air: {
      pm10: air.pm10 ?? MOCK_WEATHER.air.pm10,
      pm10_grade: air.pm10_grade ?? MOCK_WEATHER.air.pm10_grade,
      pm25: air.pm25 ?? MOCK_WEATHER.air.pm25,
      pm25_grade: air.pm25_grade ?? MOCK_WEATHER.air.pm25_grade,
    },
    pollen,
  };
}

function refreshWeather(): Promise<WeatherData> {
  if (!inflight) {
    inflight = fetchFreshWeather()
      .then((data) => {
        cache = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** 10분 캐시. 만료된 값이 있으면 그걸 바로 주고 백그라운드에서 갱신한다. */
export async function getWeatherData(): Promise<WeatherData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  if (cache) {
    void refreshWeather().catch((err) => {
      console.error("날씨 백그라운드 갱신 실패:", err);
    });
    return cache.data;
  }

  return refreshWeather();
}
