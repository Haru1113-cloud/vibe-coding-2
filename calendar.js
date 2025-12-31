registerSW();

const elGrid = document.getElementById("calendarGrid");
const elMonthLabel = document.getElementById("monthLabel");
const elPrev = document.getElementById("prevMonth");
const elNext = document.getElementById("nextMonth");

const elSelectedLabel = document.getElementById("selectedLabel");
const elSelectedTotal = document.getElementById("selectedTotal");
const elDayDetail = document.getElementById("dayDetail");

let viewYear, viewMonth; // month: 0-11
let selectedISO = todayISO();

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(y, m0) {
  return `${y}年${m0 + 1}月`;
}

function getMonthDailyTotals(y, m0) {
  // storage.js の loadDB がグローバルにある前提
  const db = loadDB();
  const map = new Map(); // iso -> total

  for (const e of db.expenses) {
    // e.date: YYYY-MM-DD
    const [yy, mm] = e.date.split("-").map(Number);
    if (yy === y && (mm - 1) === m0) {
      map.set(e.date, (map.get(e.date) || 0) + e.amount);
    }
  }
  return map;
}

function renderDayDetail(iso) {
  const { expenses, total, tags } = getDayExpenses(iso);

  elSelectedLabel.textContent = `選択日：${iso.replaceAll("-", "/")}`;
  elSelectedTotal.textContent = `合計：${yen(total)}`;

  if (!expenses.length) {
    elDayDetail.innerHTML = `<div class="empty">この日はまだ入力がないよ。</div>`;
    return;
  }

  const tagName = (id) => (tags.find(t => t.id === id)?.name) || findTagName(id);

  elDayDetail.innerHTML = "";
  for (const e of expenses) {
    const item = document.createElement("div");
    item.className = "listItem";

    const main = document.createElement("div");
    const top = document.createElement("div");
    top.className = "listTop";
    top.innerHTML = `
      <span class="pill">${tagName(e.tagId)}</span>
      <span class="amount">${yen(e.amount)}</span>
    `;

    const memo = document.createElement("div");
    memo.className = "memo";
    memo.textContent = e.memo || "";
    if (!e.memo) memo.style.display = "none";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = new Date(e.createdAt).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    main.appendChild(top);
    main.appendChild(memo);
    main.appendChild(meta);

    item.appendChild(main);
    elDayDetail.appendChild(item);
  }
}

function renderCalendar() {
  const first = new Date(viewYear, viewMonth, 1);
  const startDow = first.getDay(); // 0=Sun
  const last = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = last.getDate();

  elMonthLabel.textContent = monthLabel(viewYear, viewMonth);

  const totalsMap = getMonthDailyTotals(viewYear, viewMonth);

  elGrid.innerHTML = "";

  // 先頭の空白
  for (let i = 0; i < startDow; i++) {
    const blank = document.createElement("div");
    blank.className = "calCell calBlank";
    elGrid.appendChild(blank);
  }

  // 日付セル
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const iso = isoFromDate(date);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calCell calDay";
    cell.dataset.iso = iso;

    const top = document.createElement("div");
    top.className = "calDayNum";
    top.textContent = String(d);

    const total = totalsMap.get(iso) || 0;
    const sub = document.createElement("div");
    sub.className = "calDaySum";
    sub.textContent = total ? yen(total) : "";

    // 今日 / 選択中 / 支出あり
    const today = todayISO();
    if (iso === today) cell.classList.add("isToday");
    if (iso === selectedISO) cell.classList.add("isSelected");
    if (total > 0) cell.classList.add("hasSpend");

    cell.appendChild(top);
    cell.appendChild(sub);

    cell.addEventListener("click", () => {
      selectedISO = iso;
      renderCalendar();      // 選択ハイライト更新
      renderDayDetail(iso);  // 下に内訳表示
    });

    elGrid.appendChild(cell);
  }
}

// 初期化
(() => {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();

  selectedISO = todayISO();
  renderCalendar();
  renderDayDetail(selectedISO);

  elPrev.addEventListener("click", () => {
    viewMonth -= 1;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    renderCalendar();
  });

  elNext.addEventListener("click", () => {
    viewMonth += 1;
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    renderCalendar();
  });
})();
