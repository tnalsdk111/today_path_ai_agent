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

## 로컬 콘솔 테스트

웹 UI 없이 `npm run dev`로 띄운 로컬 API를 호출하면 됩니다. Vercel/main 배포가 필요 없습니다.

터미널 하나에서:

```bash
npm run dev
```

다른 터미널에서:

```bash
npm run agent:chat
```

```
you> 풍덕천1동
agent [success]
...해당 동 산책로 목록...

you> 30분 이내 시원한 길
agent [success]
...Claude 조건 분석 후 추천...
```

한 번만 치려면 PowerShell에서:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/agent/recommend `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"dong":"풍덕천1동"}'

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/agent/recommend `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"dong":"풍덕천1동","query":"30분 이내 시원한 길"}'
```

2단계 추천에는 `.env.local`의 `ANTHROPIC_API_KEY`가 필요합니다.

## 데이터

- `data/course-summaries.json` — 코스 자연어 설명
- `data/supported-dongs.json` — 지원 동 목록 (클릭 UI용)
