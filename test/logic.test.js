import { test } from "node:test";
import assert from "node:assert";
import { filterQuestions, availableQuestions, drawRandom, pickAttendee } from "../logic.js";

const QS = [
  { id: 1, theme: "취향 저격", type: "일반 질문", depth: 1 },
  { id: 2, theme: "취향 저격", type: "밸런스 게임", depth: 2 },
  { id: 3, theme: "믿음 이야기", type: "일반 질문", depth: 3 },
];
const ALL = { themes: ["취향 저격", "믿음 이야기"], types: ["일반 질문", "밸런스 게임"], depths: [1, 2, 3] };

test("filterQuestions: AND 결합", () => {
  assert.deepEqual(
    filterQuestions(QS, { ...ALL, themes: ["취향 저격"], types: ["일반 질문"] }).map((q) => q.id),
    [1]
  );
});

test("filterQuestions: 빈 축은 0장", () => {
  assert.equal(filterQuestions(QS, { ...ALL, themes: [] }).length, 0);
});

test("availableQuestions: excludeDrawn=true면 drawnIds 제외", () => {
  assert.deepEqual(availableQuestions(QS, ALL, [1, 3], true).map((q) => q.id), [2]);
});

test("availableQuestions: excludeDrawn=false면 전체", () => {
  assert.equal(availableQuestions(QS, ALL, [1, 3], false).length, 3);
});

test("drawRandom: 빈 풀은 null, rng 결정적", () => {
  assert.equal(drawRandom([]), null);
  assert.equal(drawRandom(QS, () => 0.99).id, 3);
  assert.equal(drawRandom(QS, () => 0).id, 1);
});

test("pickAttendee: 공정 모드 — spun 제외", () => {
  const r = pickAttendee(["A", "B", "C"], ["A", "B"], true, () => 0);
  assert.equal(r.winner, "C");
  assert.deepEqual(r.newSpunIds, ["A", "B", "C"]);
});

test("pickAttendee: 전원 소진 시 자동 리셋", () => {
  const r = pickAttendee(["A", "B"], ["A", "B"], true, () => 0);
  assert.equal(r.winner, "A");
  assert.deepEqual(r.newSpunIds, ["A"]);
});

test("pickAttendee: 명단에서 빠진 사람의 spun 기록은 무시", () => {
  const r = pickAttendee(["A", "B"], ["A", "지워진사람"], true, () => 0);
  assert.equal(r.winner, "B");
  assert.deepEqual(r.newSpunIds, ["A", "B"]);
});

test("pickAttendee: 공정 모드 OFF면 전원 대상", () => {
  const r = pickAttendee(["A", "B", "C"], ["A", "B"], false, () => 0);
  assert.equal(r.winner, "A");
});

test("pickAttendee: 0명 null / 1명 즉시", () => {
  assert.equal(pickAttendee([], [], true).winner, null);
  assert.equal(pickAttendee(["A"], [], true).winner, "A");
});
