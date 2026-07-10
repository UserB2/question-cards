// 순수 로직 — DOM 없음. 브라우저(app.js/spinner.js)와 node 테스트가 함께 사용.

export const THEMES = ["어색함 안녕", "웃음 주의보", "취향 저격", "추억 소환", "요즘 나는", "내일의 나", "마음 속 깊이", "우리 사이", "믿음 이야기"];
export const TYPES = ["일반 질문", "밸런스 게임", "만약에..?", "빈칸 채우기", "미션"];
export const DEPTH_LABELS = { 1: "가볍게", 2: "한 걸음 더", 3: "깊게" };
export const THEME_COLORS = {
  "어색함 안녕": "#4A90D9",
  "웃음 주의보": "#F2A73B",
  "취향 저격": "#E8638C",
  "추억 소환": "#9B7EDE",
  "요즘 나는": "#45B8AC",
  "내일의 나": "#5A9E6F",
  "마음 속 깊이": "#5C6BC0",
  "우리 사이": "#E57368",
  "믿음 이야기": "#C9A227",
};

export const filterQuestions = (questions, { themes, types, depths }) =>
  questions.filter(
    (q) => themes.includes(q.theme) && types.includes(q.type) && depths.includes(q.depth)
  );

export const availableQuestions = (questions, filters, drawnIds, excludeDrawn) => {
  const pool = filterQuestions(questions, filters);
  return excludeDrawn ? pool.filter((q) => !drawnIds.includes(q.id)) : pool;
};

export const drawRandom = (pool, rng = Math.random) =>
  pool.length === 0 ? null : pool[Math.floor(rng() * pool.length)];

export const pickAttendee = (attendees, spunIds, fairMode, rng = Math.random) => {
  if (attendees.length === 0) return { winner: null, newSpunIds: [] };
  if (attendees.length === 1) return { winner: attendees[0], newSpunIds: [attendees[0]] };
  let spun = fairMode ? spunIds.filter((s) => attendees.includes(s)) : [];
  let eligible = attendees.filter((a) => !spun.includes(a));
  if (eligible.length === 0) {
    spun = [];
    eligible = attendees;
  }
  const winner = eligible[Math.floor(rng() * eligible.length)];
  return { winner, newSpunIds: [...spun, winner] };
};
