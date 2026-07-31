interface UnsupportedDongNoticeProps {
  sourceText: string;
  selectedDong: string | null;
  onRecommendWithSelected: () => void;
  onRetryInput: () => void;
}

export default function UnsupportedDongNotice({
  sourceText,
  selectedDong,
  onRecommendWithSelected,
  onRetryInput,
}: UnsupportedDongNoticeProps) {
  return (
    <div
      className="flex flex-col gap-md rounded-lg bg-surface-container-lowest p-md"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <p className="font-body-md text-body-md text-on-surface leading-relaxed">
        &apos;{sourceText}&apos;은 현재 지원하지 않는 지역입니다.
        {selectedDong ? (
          <>
            <br />
            현재 선택된 &apos;{selectedDong}&apos;으로 검색하시겠어요?
          </>
        ) : (
          <>
            <br />
            지원하는 동을 선택한 뒤 다시 추천을 실행해 주세요.
          </>
        )}
      </p>

      <div className="flex flex-col gap-sm">
        {selectedDong && (
          <button
            type="button"
            onClick={onRecommendWithSelected}
            className="w-full rounded-lg bg-primary text-on-primary font-body-lg text-body-lg py-sm active:scale-[0.98] transition-transform"
          >
            {selectedDong}으로 추천받기
          </button>
        )}
        <button
          type="button"
          onClick={onRetryInput}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-lg text-body-lg py-sm active:scale-[0.98] transition-transform"
        >
          다시 입력하기
        </button>
      </div>
    </div>
  );
}
