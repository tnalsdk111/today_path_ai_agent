import { Course } from "@/types/index";

interface EnvIndicatorPanelProps {
  course: Course;
}

interface UtciGrade {
  label: string;
  bg: string;
  text: string;
}

function getUtciGrade(score: number): UtciGrade {
  if (score <= 3) return { label: "매우 쾌적", bg: "bg-[#EAF3EC]", text: "text-[#2A6B35]" };
  if (score <= 5) return { label: "쾌적",     bg: "bg-[#EAF3EC]", text: "text-[#2A6B35]" };
  if (score <= 7) return { label: "보통",     bg: "bg-[#FFF8E1]", text: "text-[#F57F17]" };
  if (score <= 9) return { label: "더움",     bg: "bg-orange-100", text: "text-orange-700" };
  return             { label: "매우 더움", bg: "bg-red-100",    text: "text-red-700"   };
}

const BIOTOPE_LABEL: Record<number, string> = {
  1: "매우 우수",
  2: "우수",
  3: "보통",
  4: "낮음",
  5: "매우 낮음",
};

function Divider() {
  return <div className="h-[0.5px] bg-[#EEEEEE] w-full" />;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between h-[44px]">{children}</div>
  );
}

function RowLeft({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
        {icon}
      </span>
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
    </div>
  );
}

function CheckBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="material-symbols-outlined text-[#2A6B35] text-[18px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        check_circle
      </span>
      <span className="text-[13px] text-[#2A6B35] font-medium">{text}</span>
    </div>
  );
}

function Dash() {
  return <span className="text-[13px] text-on-surface-variant">—</span>;
}

export default function EnvIndicatorPanel({ course }: EnvIndicatorPanelProps) {
  const utci = getUtciGrade(course.utci_score);
  const shadePercent = Math.round(course.shade_ratio * 100);
  const biotopeLabel = BIOTOPE_LABEL[course.biotope_grade] ?? "알 수 없음";

  return (
    <div
      className="bg-white rounded-[16px] p-md mb-md"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* 섹션 헤더 */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2A6B35] text-[20px]">
            thermometer
          </span>
          <span className="text-[16px] font-bold text-[#1A3A1A]">환경 지표</span>
        </div>
        <span className="text-[12px] text-[#9E9E9E] ml-[32px]">
          기후플랫폼 데이터 기반
        </span>
      </div>

      {/* 지표 행 목록 */}
      <div className="flex flex-col">
        {/* Row 1 — 체감온도 */}
        <Row>
          <RowLeft icon="device_thermostat" label="체감온도 (UTCI)" />
          <span
            className={`${utci.bg} ${utci.text} text-[13px] font-semibold px-3 py-1 rounded-[8px]`}
          >
            {utci.label}
          </span>
        </Row>

        <Divider />

        {/* Row 2 — 그늘 비율 */}
        <Row>
          <RowLeft icon="partly_cloudy_day" label="그늘 비율" />
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-on-surface font-medium">
              {shadePercent}%
            </span>
            <div className="w-[80px] h-[6px] bg-[#E0E0E0] rounded-full overflow-hidden">
              <div
                className="bg-[#2A6B35] h-full"
                style={{ width: `${shadePercent}%` }}
              />
            </div>
          </div>
        </Row>

        <Divider />

        {/* Row 3 — 생태 가치 */}
        <Row>
          <RowLeft icon="eco" label="생태 가치 (비오톱)" />
          <span className="bg-[#E0F2F1] text-[#00695C] text-[13px] font-semibold px-3 py-1 rounded-[8px]">
            {course.biotope_grade}등급 ({biotopeLabel})
          </span>
        </Row>

        <Divider />

        {/* Row 4 — 생태축 인접 */}
        <Row>
          <RowLeft icon="hub" label="생태축 인접" />
          {course.eco_axis ? <CheckBadge text="인접" /> : <Dash />}
        </Row>

        <Divider />

        {/* Row 5 — 무더위쉼터 */}
        <Row>
          <RowLeft icon="home" label="무더위쉼터" />
          {course.shelter_nearby ? <CheckBadge text="쉼터 인근" /> : <Dash />}
        </Row>
      </div>
    </div>
  );
}
