import { pickAttendee } from "../logic.js";

/* ── localStorage ── */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

let attendees = store.get("qcard-attendees", []);
let spun = store.get("qcard-spun", []);
let circleAngle = 0; // 누적 회전 각도
let spinning = false;

const RADIUS = 88; // px — 210px 원 - 34px 아바타에 맞춤

const $ = (sel) => document.querySelector(sel);
const listEl = $("#attendee-list");
const nameInput = $("#attendee-name");
const circleEl = $("#spinner-circle");
const wrapEl = $("#spinner-wrap");
const winnerEl = $("#winner-label");
const spinBtn = $("#spin-btn");
const fairToggle = $("#fair-toggle");

/* ── 아바타 ── */
function nameColor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) % 360;
  return `hsl(${hash}, 62%, 52%)`;
}

function makeAvatar(name) {
  const div = document.createElement("div");
  div.className = "avatar";
  div.style.background = nameColor(name);
  div.textContent = name[0];
  div.title = name;
  return div;
}

/* ── 롤콜 목록 ── */
function renderRollCall() {
  listEl.replaceChildren(...attendees.map((name) => {
    const li = document.createElement("li");
    li.append(makeAvatar(name));
    const span = document.createElement("span");
    span.textContent = name;
    li.append(span);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "remove-btn";
    rm.textContent = "✕";
    rm.title = `${name} 삭제`;
    rm.addEventListener("click", () => removeAttendee(name));
    li.append(rm);
    return li;
  }));
  wrapEl.hidden = attendees.length === 0;
  renderCircle();
}

/* ── 원형 배치: rotate(θ+A) translateY(-R) rotate(-(θ+A)) → 글자는 항상 수직 ── */
function avatarTransform(baseAngle, angle) {
  const total = baseAngle + angle;
  return `rotate(${total}deg) translateY(-${RADIUS}px) rotate(${-total}deg)`;
}

function renderCircle() {
  circleEl.replaceChildren(...attendees.map((name, i) => {
    const holder = document.createElement("div");
    holder.className = "spin-avatar";
    holder.dataset.base = (360 * i) / attendees.length;
    holder.style.transition = "none"; // 배치 시에는 애니메이션 없이
    holder.style.transform = avatarTransform(Number(holder.dataset.base), circleAngle);
    holder.append(makeAvatar(name));
    return holder;
  }));
}

function saveAll() {
  store.set("qcard-attendees", attendees);
  store.set("qcard-spun", spun);
}

/* ── 추가/삭제 ── */
function addAttendee() {
  const name = nameInput.value.trim();
  nameInput.value = "";
  nameInput.focus();
  if (!name || attendees.includes(name)) return;
  attendees.push(name);
  saveAll();
  renderRollCall();
}

function removeAttendee(name) {
  attendees = attendees.filter((n) => n !== name);
  spun = spun.filter((n) => n !== name);
  winnerEl.textContent = "";
  saveAll();
  renderRollCall();
}

/* ── 스핀 ── */
function spin() {
  if (spinning || attendees.length === 0) return;
  const { winner, newSpunIds } = pickAttendee(attendees, spun, fairToggle.checked);
  if (!winner) return;
  spun = newSpunIds;
  saveAll();

  if (attendees.length === 1) {
    winnerEl.textContent = `🌟 ${winner} 🌟`;
    return;
  }

  const winnerIndex = attendees.indexOf(winner);
  const baseAngle = (360 * winnerIndex) / attendees.length;
  // 당첨자가 상단 포인터(0°)에 오도록: baseAngle + 최종각 ≡ 0 (mod 360)
  const delta = ((-baseAngle - circleAngle) % 360 + 360) % 360;
  circleAngle += 4 * 360 + delta;

  spinning = true;
  spinBtn.disabled = true;
  winnerEl.textContent = "두구두구두구...";

  const holders = circleEl.querySelectorAll(".spin-avatar");
  holders.forEach((h) => {
    h.style.transition = ""; // style.css의 3.2s cubic-bezier 사용
    h.style.transform = avatarTransform(Number(h.dataset.base), circleAngle);
  });

  setTimeout(() => {
    spinning = false;
    spinBtn.disabled = false;
    winnerEl.textContent = `🌟 ${winner} 🌟`;
  }, 3300);
}

/* ── 배선 ── */
$("#add-attendee").addEventListener("click", addAttendee);
nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addAttendee(); });
spinBtn.addEventListener("click", spin);
document.addEventListener("card-revealed", () => { if (!spinning) winnerEl.textContent = ""; });

renderRollCall();
