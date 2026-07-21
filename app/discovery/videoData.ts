export type VideoTag = "건강" | "산책로" | "노래";

export interface DiscoveryVideo {
  id: string;
  title: string;
  channelName: string;
  youtubeId: string;
  videoUrl: string;
  tag: VideoTag;
}

/** 유튜브 공식 썸네일 URL (UI에서 youtubeId로 동적 생성) */
export function getYoutubeThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

export const discoveryVideos: DiscoveryVideo[] = [
  {
    id: "v1",
    title: "🦵🦵'걷기 운동' 하루 20분으로 이루어지는 마법!ㅣ논문으로 검증된 장점 6가지! ㅣ얼마나 어떻게 걸어야 할까요 ? 딱 정리해드립니다!",
    channelName: "닥터 코뿔소 Dr. Rhino",
    youtubeId: "oQjiWWbhIHk",
    videoUrl: "https://www.youtube.com/watch?v=oQjiWWbhIHk",
    tag: "건강",
  },
  {
    id: "v2",
    title: "🚶‍♂️매일 20분 산책, 칸트와 소로가 매일 산책한 이유는? 산책이 주는 효능 세가지 l 임마누엘 칸트, 헨리 소로 l 건강한 삶의 노하우 l 생각을 정리하는 시간, 생각의 힘",
    channelName: "김교수의 세 가지",
    youtubeId: "P-_rv4qqASs",
    videoUrl: "https://www.youtube.com/watch?v=P-_rv4qqASs",
    tag: "건강",
  },
  {
    id: "v3",
    title: "병원 근처에 이런 힐링 산책길이? 용인수지병원에서 정평공원까지 함께 걸어요",
    channelName: "용인수지병원",
    youtubeId: "Iskx-ga8iDI",
    videoUrl: "https://www.youtube.com/watch?v=Iskx-ga8iDI",
    tag: "산책로",
  },
  {
    id: "v4",
    title: "도심 속 호수 공원 한바퀴 | 광교호수공원 ( Suwon-Gwanggyo Lake Park)",
    channelName: "미니맥스 여행시선",
    youtubeId: "5OjY9PnX0ZM",
    videoUrl: "https://www.youtube.com/watch?v=5OjY9PnX0ZM",
    tag: "산책로",
  },
  {
    id: "v5",
    title: "𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 낭만적인 밤, 산책갈 때 꼭 챙겨야 할 감성 플레이리스트",
    channelName: "기몽초 ɢɪᴍᴏɴɢᴄʜᴏ",
    youtubeId: "f0TzF_hOvKo",
    videoUrl: "https://www.youtube.com/watch?v=f0TzF_hOvKo",
    tag: "노래",
  },
  {
    id: "v6",
    title: "신나는 산책 플리, 기분좋은 한 주의 시작! 신나는 노래, 활기찬 팝송🍀Design making tutorial",
    channelName: "Blue rain",
    youtubeId: "jNxT91p8htE",
    videoUrl: "https://www.youtube.com/watch?v=jNxT91p8htE",
    tag: "노래",
  },
];
