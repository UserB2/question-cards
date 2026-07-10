// 순수 로직 — DOM 없음. 브라우저(app.js/spinner.js)와 node 테스트가 함께 사용.

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
