import { Course } from "@/types/index";

interface EnvIndicatorPanelProps {
  course: Course;
}

interface Tag {
  label: string;
  bg: string;
  text: string;
}

function getUtciTag(score: number): Tag {
  if (score <= 3) return { label: "매우 시원함", bg: "bg-blue-50", text: "text-blue-700" };
  if (score <= 5) return { label: "쾌적", bg: "bg-[#EAF3EC]", text: "text-primary" };
  if (score <= 7) return { label: "따뜻함", bg: "bg-orange-50", text: "text-orange-700" };
  return { label: "더움", bg: "bg-red-50", text: "text-red-700" };
}

function getShadeTags(ratio: number): Tag[] {
  if (ratio < 0.3)
    return [
      { label: "그늘 거의 없음", bg: "bg-orange-50", text: "text-orange-700" },
      { label: "양산 필요", bg: "bg-orange-50", text: "text-orange-700" },
    ];
  if (ratio < 0.6)
    return [{ label: "일부 그늘", bg: "bg-[#EAF3EC]", text: "text-primary" }];
  if (ratio < 0.8)
    return [{ label: "대부분 그늘", bg: "bg-[#EAF3EC]", text: "text-primary" }];
  return [{ label: "그늘 충분", bg: "bg-blue-50", text: "text-blue-700" }];
}

// grade 4~5는 null 반환 → 행 미표시
function getBiotopeTag(grade: number): Tag | null {
  if (grade === 1 || grade === 2)
    return { label: "자연이 잘 보존된 코스", bg: "bg-[#EAF3EC]", text: "text-primary" };
  if (grade === 3)
    return { label: "녹지가 있는 코스", bg: "bg-surface-container", text: "text-on-surface-variant" };
  return null;
}

function Divider() {
  return <div className="h-[0.5px] bg-outline-variant/30" />;
}

function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`${tag.bg} ${tag.text} font-label-sm text-label-sm px-2 py-0.5 rounded-full`}
    >
      {tag.label}
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between min-h-[44px] py-1 gap-2">
      <span className="font-body-md text-body-md text-on-surface shrink-0">{label}</span>
      <div className="flex gap-1 flex-wrap justify-end">{children}</div>
    </div>
  );
}

export default function EnvIndicatorPanel({ course }: EnvIndicatorPanelProps) {
  const utciTag = getUtciTag(course.utci_score);
  const shadeTags = getShadeTags(course.shade_ratio);
  const biotopeTag = getBiotopeTag(course.biotope_grade);

  return (
    <section className="mb-md">
      <h2 className="font-h3 text-h3 text-on-surface mb-sm">이 코스의 환경</h2>

      <div className="flex flex-col">
        <Row label="체감온도 (UTCI)">
          <TagBadge tag={utciTag} />
        </Row>

        <Divider />

        <Row label="그늘">
          {shadeTags.map((tag) => (
            <TagBadge key={tag.label} tag={tag} />
          ))}
        </Row>

        {biotopeTag && (
          <>
            <Divider />
            <Row label="자연 보존 등급">
              <TagBadge tag={biotopeTag} />
            </Row>
          </>
        )}

        {course.eco_axis && (
          <>
            <Divider />
            <Row label="자연 연결 구간">
              <TagBadge tag={{ label: "자연 연결 구간을 지나요", bg: "bg-[#EAF3EC]", text: "text-primary" }} />
            </Row>
          </>
        )}

        {course.shelter_nearby && (
          <>
            <Divider />
            <Row label="무더위쉼터">
              <TagBadge tag={{ label: "근처에 쉼터가 있어요", bg: "bg-[#EAF3EC]", text: "text-primary" }} />
            </Row>
          </>
        )}
      </div>
    </section>
  );
}
