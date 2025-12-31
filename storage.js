const DB_KEY = "expense_pwa_db_v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const init = {
        tags: [
          { id: uid(), name: "食費" },
          { id: uid(), name: "カフェ" },
          { id: uid(), name: "交通" },
          { id: uid(), name: "日用品" },
          { id: uid(), name: "交際" },
        ],
        expenses: []
      };
      saveDB(init);
      return init;
    }
    const db = JSON.parse(raw);
    return {
      tags: Array.isArray(db.tags) ? db.tags : [],
      expenses: Array.isArray(db.expenses) ? db.expenses : []
    };
  } catch {
    const fallback = { tags: [], expenses: [] };
    saveDB(fallback);
    return fallback;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function addTag(name) {
  const db = loadDB();
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("タグ名が空です");
  if (db.tags.some(t => t.name === trimmed)) throw new Error("同名のタグがすでにあります");
  const tag = { id: uid(), name: trimmed };
  db.tags.unshift(tag);
  saveDB(db);
  return tag;
}

function ensureUncategorized(db) {
  let un = db.tags.find(t => t.name === "未分類");
  if (!un) {
    un = { id: uid(), name: "未分類" };
    db.tags.unshift(un);
  }
  return un;
}

function deleteTag(tagId) {
  const db = loadDB();
  const un = ensureUncategorized(db);
  db.tags = db.tags.filter(t => t.id !== tagId);
  db.expenses = db.expenses.map(e => e.tagId === tagId ? { ...e, tagId: un.id } : e);
  saveDB(db);
}

function addExpense({ date, amount, tagId, memo }) {
  const db = loadDB();
  const a = Number(amount);
  if (!date) throw new Error("日付がありません");
  if (!Number.isFinite(a) || a <= 0) throw new Error("金額は1円以上で入力してね");
  if (!tagId) throw new Error("タグがありません");

  const exp = {
    id: uid(),
    date,
    amount: Math.round(a),
    tagId,
    memo: String(memo || "").trim(),
    createdAt: Date.now()
  };
  db.expenses.unshift(exp);
  saveDB(db);
  return exp;
}

function deleteExpense(expenseId) {
  const db = loadDB();
  db.expenses = db.expenses.filter(e => e.id !== expenseId);
  saveDB(db);
}

function findTagName(tagId) {
  const db = loadDB();
  const t = db.tags.find(x => x.id === tagId);
  return t ? t.name : "未分類";
}

function getDayExpenses(date) {
  const db = loadDB();
  const list = db.expenses.filter(e => e.date === date);
  const total = list.reduce((s, e) => s + e.amount, 0);
  return { expenses: list, total, tags: db.tags };
}

function getWeekTotals(endingISO) {
  const db = loadDB();
  const end = new Date(endingISO + "T00:00:00");
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${day}`;
    const total = db.expenses.filter(e => e.date === iso).reduce((s, e) => s + e.amount, 0);
    days.push({ date: iso, total });
  }

  return { days, weekTotal: days.reduce((s, x) => s + x.total, 0) };
}

/** PWA: Service Worker 登録（両ページで呼べる） */
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
