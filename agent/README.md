# 산책로 추천 에이전트

탐색(`/discovery`) 탭 UI와 **분리된** 추천 에이전트 모듈입니다.

## 2단계 대화 흐름

```
[사용자] 동 클릭 (예: 풍덕천1동)
    ↓ POST { "dong": "풍덕천1동" }
[에이전트] 해당 동 산책로 목록 + "추가 조건?" 안내

[사용자] 추가 조건 입력 (예: "30분 이내 시원한 길")
    ↓ POST { "dong": "풍덕천1동", "query": "..." }
[에이전트] 조건에 맞는 산책로 추천 (자연어)
```

## API

### 1단계 — 동 선택 후 목록

```http
POST /api/agent/recommend
{ "dong": "풍덕천1동" }
```

LLM 호출 없음.

### 2단계 — 추가 조건 추천

```http
POST /api/agent/recommend
{
  "dong": "풍덕천1동",
  "query": "30분 이내 시원한 길 추천해줘"
}
```

`ANTHROPIC_API_KEY` 필요. Claude가 조건을 분석한다 (`lib/analyzeNaturalLanguageQueryClaude.ts`).
탐색 탭(`/api/analyze`)은 기존처럼 `OPENAI_API_KEY`를 쓴다.

## 구조

```
agent/
  availableConditions.ts      # 안내 가능 조건 목록
  listDongCourses.ts          # 동별 코스 조회
  formatDongIntroMessage.ts   # 1단계 메시지 포맷
  runDongIntro.ts               # 1단계 진입점
  formatRecommendationMessage.ts
  runWalkRecommendation.ts    # 2단계 진입점
```

## 데이터

- `data/course-summaries.json` — 코스 자연어 설명
- `data/supported-dongs.json` — 지원 동 목록 (클릭 UI용)
