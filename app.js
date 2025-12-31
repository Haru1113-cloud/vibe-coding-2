// SW登録（オフライン対応）
registerSW();

const elDate = document.getElementById("date");
const elTotal = document.getElementById("todayTotal");
const elTagSelect = document.getElementById("tagSelect");
const elNewTag = document.getElementById("newTag");
const elAddTagBtn = document.getElementById("addTagBtn");
const elTagError = document.getElementById("tagError");
const elTagChips = document.getElementById("tagChips");

const elAmount = document.getElementById("amount");
const elMemo = document.getElementById("memo");
const elAddExpenseBtn = document.getElementById("addExpenseBtn");
const elExpenseError = document.getElementById("expenseError");
const elList = document.getElementById("expenseList");

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

function showError(el, msg) {
  if (!msg) {
    el.classList.add("hidden");
    el.textContent = "";
  } else {
    el.classList.remove("hidden");
    el.textContent = msg;
  }
}

function renderTags(tags, selectedId) {
  elTagSelect.innerHTML = "";
  tags.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    elTagSelect.appendChild(opt);
  });
  if (selectedId) elTagSelect.value = selectedId;

  elTagChips.innerHTML = "";
  tags.forEach(t => {
    const chip = document.createElement("div");
    chip.className = "tagChip";
    chip.innerHTML = `<span>${t.name}</span>`;
    const del = document.createElement("button");
    del.className = "tagDel";
    del.textContent = "×";
    del.title = "タグ削除";
    del.addEventListener("click", () => {
      deleteTag(t.id);
      refresh();
    });
    chip.appendChild(del);
    elTagChips.appendChild(chip);
  });
}

function renderList(expenses, tags) {
  if (!expenses.length) {
    elList.innerHTML = `<div class="empty">まだ入力がないよ。上から追加してね。</div>`;
    return;
  }

  const tagName = (id) => (tags.find(t => t.id === id)?.name) || findTagName(id);

  elList.innerHTML = "";
  expenses.forEach(e => {
    const item = document.createElement("div");
    item.className = "listItem";

    const main = document.createElement("div");
    main.className = "listMain";

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
    const t = new Date(e.createdAt);
    meta.textContent = t.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

    main.appendChild(top);
    main.appendChild(memo);
    main.appendChild(meta);

    const del = document.createElement("button");
    del.className = "btnDanger";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      deleteExpense(e.id);
      refresh();
    });

    item.appendChild(main);
    item.appendChild(del);
    elList.appendChild(item);
  });
}

function refresh() {
  const date = elDate.value;
  const { expenses, total, tags } = getDayExpenses(date);

  elTotal.textContent = yen(total);
  const currentTag = elTagSelect.value || (tags[0] ? tags[0].id : "");
  renderTags(tags, currentTag);
  renderList(expenses, tags);

  validateAdd();
}

function validateAdd() {
  const a = Number(elAmount.value);
  const ok = elTagSelect.value && Number.isFinite(a) && a > 0;
  elAddExpenseBtn.disabled = !ok;
}

elDate.value = todayISO();
refresh();

elDate.addEventListener("change", refresh);
elAmount.addEventListener("input", validateAdd);
elTagSelect.addEventListener("change", validateAdd);

elAddTagBtn.addEventListener("click", () => {
  showError(elTagError, "");
  try {
    const tag = addTag(elNewTag.value);
    elNewTag.value = "";
    // 追加したタグを選択
    refresh();
    elTagSelect.value = tag.id;
  } catch (e) {
    showError(elTagError, e.message || "タグ追加に失敗した");
  }
});

elAddExpenseBtn.addEventListener("click", () => {
  showError(elExpenseError, "");
  try {
    addExpense({
      date: elDate.value,
      amount: elAmount.value,
      tagId: elTagSelect.value,
      memo: elMemo.value
    });
    elAmount.value = "";
    elMemo.value = "";
    refresh();
  } catch (e) {
    showError(elExpenseError, e.message || "追加に失敗した");
  }
});
