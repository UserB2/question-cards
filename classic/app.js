import {
  THEMES, TYPES, DEPTH_LABELS, THEME_COLORS, migrateThemes,
  availableQuestions, drawRandom,
} from "../logic.js";

/* ── localStorage ── */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

/* ── 상태 ── */
const DEFAULT_FILTERS = { themes: [...THEMES], types: [...TYPES], depths: [1, 2, 3], excludeDrawn: true };
let questions = [];
let filters = { ...DEFAULT_FILTERS, ...store.get("qcard-filters", {}) };
filters.themes = migrateThemes(filters.themes);
let drawn = store.get("qcard-drawn", []);
let currentCard = null; // null | 질문 객체

/* ── DOM ── */
const $ = (sel) => document.querySelector(sel);
const setupScreen = $("#setup-screen");
const deckScreen = $("#deck-screen");
const card = $("#card");
const deckPile = $("#deck-pile");
const emptyState = $("#empty-state");
const stageHint = $("#stage-hint");
const nextCardBtn = $("#next-card");

/* ── 칩 렌더링 ── */
function makeChip(label, isOn, color, onToggle, subLabel) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip" + (isOn ? " on" : "");
  btn.innerHTML = subLabel ? `${label}<small>${subLabel}</small>` : label;
  if (color) btn.style.setProperty("--chip-color", color);
  btn.addEventListener("click", () => {
    btn.classList.toggle("on");
    onToggle(btn.classList.contains("on"));
    saveFilters();
    updateCount();
  });
  return btn;
}

function toggleValue(arr, value, on) {
  const i = arr.indexOf(value);
  if (on && i === -1) arr.push(value);
  if (!on && i !== -1) arr.splice(i, 1);
}

function renderChips() {
  const themeBox = $("#theme-chips");
  themeBox.replaceChildren(...THEMES.map((t) =>
    makeChip(t, filters.themes.includes(t), THEME_COLORS[t], (on) => toggleValue(filters.themes, t, on))
  ));
  const typeBox = $("#type-chips");
  typeBox.replaceChildren(...TYPES.map((t) =>
    makeChip(t, filters.types.includes(t), null, (on) => toggleValue(filters.types, t, on))
  ));
  const depthBox = $("#depth-chips");
  depthBox.replaceChildren(...[1, 2, 3].map((d) =>
    makeChip(`깊이 ${d}`, filters.depths.includes(d), null, (on) => toggleValue(filters.depths, d, on), DEPTH_LABELS[d])
  ));
  $("#exclude-toggle").checked = filters.excludeDrawn;
}

function saveFilters() { store.set("qcard-filters", filters); }

/* ── 카운트 ── */
function pool() { return availableQuestions(questions, filters, drawn, filters.excludeDrawn); }

function updateCount() {
  const n = pool().length;
  const countEl = $("#pool-count");
  if (n === 0) {
    countEl.innerHTML = "지금 조건으로 뽑을 수 있는 카드가 없어요 😢 조건을 넓히거나 기록을 초기화해 보세요.";
    countEl.classList.add("zero");
  } else {
    countEl.innerHTML = `지금 조건으로 <strong>${n}장</strong> 뽑을 수 있어요`;
    countEl.classList.remove("zero");
  }
  $("#start-btn").disabled = n === 0;
  $("#remaining-badge").textContent = `${n}장`;
  deckPile.classList.toggle("disabled", n === 0 && !currentCard);
}

/* ── 화면 전환 ── */
function showDeck() { setupScreen.hidden = true; deckScreen.hidden = false; updateCount(); }
function showSetup() { deckScreen.hidden = true; setupScreen.hidden = false; updateCount(); }

/* ── 뽑기 / 플립 / 버리기 ── */
function drawCard() {
  if (currentCard) return; // 카드가 이미 테이블 위에 있음
  const q = drawRandom(pool());
  if (!q) { emptyState.hidden = false; stageHint.hidden = true; return; }
  currentCard = q;

  card.style.setProperty("--theme-color", THEME_COLORS[q.theme]);
  card.querySelector(".card-back-theme").textContent = q.theme;
  card.querySelector(".label-type").textContent = q.type;
  card.querySelector(".label-depth").textContent = `깊이 ${q.depth} · ${DEPTH_LABELS[q.depth]}`;
  card.querySelector(".card-question").textContent = q.text;
  card.querySelector(".card-theme-name").textContent = q.theme;

  card.classList.remove("flipped", "fly-up", "fly-down");
  card.hidden = false;
  card.classList.add("dealing");
  card.addEventListener("animationend", () => card.classList.remove("dealing"), { once: true });

  stageHint.hidden = true;
  emptyState.hidden = true;
  nextCardBtn.hidden = false;

  if (filters.excludeDrawn) {
    if (!drawn.includes(q.id)) drawn.push(q.id);
    store.set("qcard-drawn", drawn);
  }
  updateCount();
}

function flipCard() {
  if (!currentCard || card.classList.contains("flipped")) return;
  card.classList.add("flipped");
  document.dispatchEvent(new CustomEvent("card-revealed"));
}

function discardCard(direction = "fly-up") {
  if (!currentCard) return;
  card.classList.add(direction);
  nextCardBtn.hidden = true;
  setTimeout(() => {
    card.hidden = true;
    card.classList.remove(direction, "flipped");
    currentCard = null;
    if (pool().length === 0) { emptyState.hidden = false; }
    updateCount();
  }, 470);
}

/* ── 스와이프 (pointer events: 터치+마우스) ── */
let pointerStartY = null;
let swiped = false;
card.addEventListener("pointerdown", (e) => { pointerStartY = e.clientY; swiped = false; });
card.addEventListener("pointerup", (e) => {
  if (pointerStartY === null) return;
  const dy = e.clientY - pointerStartY;
  pointerStartY = null;
  if (Math.abs(dy) > 60) {
    swiped = true;
    if (card.classList.contains("flipped")) discardCard(dy < 0 ? "fly-up" : "fly-down");
  }
});
card.addEventListener("click", () => { if (!swiped) flipCard(); });

/* ── 이벤트 배선 ── */
$("#start-btn").addEventListener("click", showDeck);
$("#to-setup").addEventListener("click", showSetup);
$("#empty-setup").addEventListener("click", showSetup);
deckPile.addEventListener("click", drawCard);
nextCardBtn.addEventListener("click", () => discardCard("fly-up"));
$("#exclude-toggle").addEventListener("change", (e) => {
  filters.excludeDrawn = e.target.checked;
  saveFilters();
  updateCount();
});
function resetDrawn() {
  drawn = [];
  store.set("qcard-drawn", drawn);
  emptyState.hidden = true;
  if (!currentCard) stageHint.hidden = false;
  updateCount();
}
$("#reset-drawn").addEventListener("click", resetDrawn);
$("#empty-reset").addEventListener("click", resetDrawn);

/* ── 초기화 ── */
fetch("../questions.json")
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((data) => { questions = data; renderChips(); updateCount(); })
  .catch(() => {
    $("#pool-count").textContent = "questions.json을 불러오지 못했어요. 로컬에서는 python -m http.server로 실행해 주세요.";
    $("#start-btn").disabled = true;
  });
