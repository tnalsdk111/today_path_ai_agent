// 테마 유형
export type Theme = "park" | "lake" | "forest" | "stream";

// 꽃가루 종류
export type PollenTag = "pine" | "birch" | "grass" | "oak";

// 대기질 등급
export type AirGrade = "좋음" | "보통" | "나쁨" | "매우나쁨";

// 꽃가루 농도 수준
export type PollenLevel = "없음" | "낮음" | "보통" | "높음";

// 시설 위치 정보
export interface Facility {
  lat: number;
  lng: number;
  name: string;
}

// 화장실 시설 상세 정보
export type ToiletFacility = {
  lat: number
  lng: number
  name: string
  accessible: boolean    // 장애인용 대변기 1개 이상
  children: boolean      // 어린이용 대변기 1개 이상
  emergency_bell: boolean // 비상벨 설치 여부
}

// 식생 수종 정보
export interface VegetationSpecies {
  name: string;          // 예: "소나무"
  bloom_period: string;  // 예: "3월~5월"
  pollen_period: string; // 예: "4월~5월"
  note: string;          // 예: "꽃가루 주의"
}

// 산책 코스 정보
export interface Course {
  id: string;
  name: string;
  dong: string;
  distance_km: number;
  duration_min: number;
  is_loop: boolean;
  difficulty: "flat" | "moderate";
  night_safe: boolean;
  has_stream: boolean;
  themes: Theme[];
  polyline: string; // Google Encoded Polyline
  start_point: { lat: number; lng: number };
  facilities: { toilets: ToiletFacility[]; park_entrances: Facility[] };
  toilet_count: number;
  vegetation: { tags: PollenTag[]; description: string; species: VegetationSpecies[] };
  slope_grade: number;     // DTM 기반 평균 경사도, 낮을수록 평탄
  utci_score: number;      // 1~10, 낮을수록 시원
  shade_ratio: number;     // 0~1, 그늘 비율
  biotope_grade: number;   // 1~5, 1이 자연가치 최고
  eco_axis: boolean;       // 생태축 인접 여부
  flood_risk: boolean;     // 극한호우 위험 여부
  shelter_nearby: boolean; // 무더위쉼터 인접 여부
  park_grade: number;      // 1~5, 도시공원 서비스 평가 등급
}

// 날씨 및 환경 데이터
export interface WeatherData {
  updated_at: string;
  location: string;
  weather: {
    temp: number;
    feels_like: number;
    condition: "맑음" | "구름많음" | "흐림" | "비" | "눈";
    is_raining: boolean;
  };
  air: {
    pm10: number;
    pm10_grade: AirGrade;
    pm25: number;
    pm25_grade: AirGrade;
  };
  pollen: {
    pine: PollenLevel;
    birch: PollenLevel;
    grass: PollenLevel;
  };
}

// 필터 조건
export interface FilterOptions {
  dong: string;
  duration?: 30 | 60 | 120;
  themes?: Theme[];
  nightSafe?: boolean;
  flatPriority?: boolean;
  coolPriority?: boolean;
  toiletPriority?: boolean;
  naturePriority?: boolean;
}

// 코스 점수 가중치
export interface FilterWeights {
  flat: number;
  cool: number;
  toilet: number;
  nature: number;
}
