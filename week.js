registerSW();

const elEnd = document.getElementById("endDate");
const elWeekTotal = document.getElementById("weekTotal");
const elChart = document.getElementById("chart");

function yen(n) {
  return "¥" + Number(n || 0).toLocaleString("ja-JP");
}

function renderChart(days) {
  elChart.innerHTML = "";
  const max = Math.max(1, ...days.map(d => d.total));

  days.forEach(d => {
    const h = Math.round((d.total / max) * 100);
    const label = d.date.slice(5).replace("-", "/");

    const col = document.createElement("div");
    col.className = "barCol";
    col.title = yen(d.total);

    const wrap = document.createElement("div");
    wrap.className = "barWrap";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${h}%`;

    wrap.appendChild(bar);

    const lab = document.createElement("div");
    lab.className = "barLabel";
    lab.textContent = label;

    const val = document.createElement("div");
    val.className = "barValue";
    val.textContent = yen(d.total);

    col.appendChild(wrap);
    col.appendChild(lab);
    col.appendChild(val);

    elChart.appendChild(col);
  });
}

function refresh() {
  const { days, weekTotal } = getWeekTotals(elEnd.value);
  elWeekTotal.textContent = yen(weekTotal);
  renderChart(days);
}

elEnd.value = todayISO();
refresh();
elEnd.addEventListener("change", refresh);
