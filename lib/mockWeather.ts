import mockWeatherData from "@/data/mock-weather.json";
import type { WeatherData } from "@/types/index";

export const MOCK_WEATHER: WeatherData = {
  ...(mockWeatherData as WeatherData),
  updated_at: new Date().toISOString(),
};
