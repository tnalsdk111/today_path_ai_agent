import { WeatherData } from "@/types/index";

export const MOCK_WEATHER: WeatherData = {
  updated_at: new Date().toISOString(),
  location: "수지구",
  weather: { temp: 18, feels_like: 17, condition: "맑음", is_raining: false },
  air: { pm10: 45, pm10_grade: "보통", pm25: 18, pm25_grade: "좋음" },
  pollen: { pine: "높음", birch: "보통", grass: "없음" },
};
