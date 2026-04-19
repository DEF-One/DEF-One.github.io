const teams = [
  { id: "bt1", code: "BT1", name: "Bautrupp 1" },
  { id: "bt2", code: "BT2", name: "Bautrupp 2" },
  { id: "bt3", code: "BT3", name: "Bautrupp 3" },
  { id: "bt4", code: "BT4", name: "Bautrupp 4" }
];

let orders = [
  {
    id: crypto.randomUUID(),
    title: "Hausanschluss Müller",
    address: "Musterstraße 12, 70173 Stuttgart",
    teamId: "bt1",
    scheduledDate: "2026-05-11",
    crew: "Kolonne A",
    quantity: "2 MA / 1 Tag",
    klsId: "KLS-1032",
    vaoStatus: "gestellt",
    details: "Leerrohr und Hausanschluss vorbereiten"
  },
  {
    id: crypto.randomUUID(),
    title: "Tiefbau Weber",
    address: "Bahnhofstraße 4, 70182 Stuttgart",
    teamId: "bt1",
    scheduledDate: "2026-05-12",
    crew: "Kolonne B",
    quantity: "3 MA / 1 Tag",
    klsId: "KLS-2044",
    vaoStatus: "da",
    details: "Bordsteinöffnung und Einzug"
  },
  {
    id: crypto.randomUUID(),
    title: "Netzausbau Süd",
    address: "Industrieweg 8, 70565 Stuttgart",
    teamId: "bt1",
    scheduledDate: "2026-05-14",
    crew: "Kolonne A",
    quantity: "2 MA / 2 Tage",
    klsId: "KLS-9981",
    vaoStatus: "nicht_gestellt",
    details: "Abschnitt prüfen, Baugrube vorbereiten"
  }
];

const teamSelect = document.getElementById("teamSelect");
const weekSelect = document.getElementById("weekSelect");
const yearSelect = document.getElementById("yearSelect");
const selectionBox = document.getElementById("selectionBox");
const weekGrid = document.getElementById("weekGrid");

const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const currentWeekBtn = document.getElementById("currentWeekBtn");
const newOrderBtn = document.getElementById("newOrderBtn");
const pdfBtn = document.getElementById("pdfBtn");

const orderModal = document.getElementById("orderModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const orderForm = document.getElementById("orderForm");

const orderTitle = document.getElementById("orderTitle");
const orderAddress = document.getElementById("orderAddress");
const orderTeam = document.getElementById("orderTeam");
const orderDate = document.getElementById("orderDate");
const orderCrew = document.getElementById("orderCrew");
const orderQuantity = document.getElementById("orderQuantity");
const orderKlsId = document.getElementById("orderKlsId");
const orderVaoStatus = document.getElementById("orderVaoStatus");
const orderDetails = document.getElementById("orderDetails");

function getISOWeek(date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
}

function getISOWeekYear(date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
  return tempDate.getUTCFullYear();
}

function getDateFromISOWeek(year, week, dayOffset = 0) {
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  monday.setUTCDate(monday.getUTCDate() + dayOffset);
  return monday;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatISODate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getVaoText(status) {
  switch (status) {
    case "gestellt":
      return "VAO gestellt";
    case "nicht_gestellt":
      return "VAO nicht gestellt";
    case "da":
      return "VAO da";
    case "nicht_noetig":
      return "VAO nicht nötig";
    default:
      return "VAO offen";
  }
}

function fillTeamOptions() {
  teamSelect.innerHTML = "";
  orderTeam.innerHTML = "";

  teams.forEach((team) => {
    const option1 = document.createElement("option");
    option1.value = team.id;
    option1.textContent = `${team.code} - ${team.name}`;
    teamSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = team.id;
    option2.textContent = `${team.code} - ${team.name}`;
    orderTeam.appendChild(option2);
  });
}

function fillWeekOptions() {
  weekSelect.innerHTML = "";
  for (let i = 1; i <= 53; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `KW ${i}`;
    weekSelect.appendChild(option);
  }
}

function fillYearOptions() {
  yearSelect.innerHTML = "";
  [2025, 2026, 2027, 2028].forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });
}

function getSelectedTeam() {
  return teams.find((team) => team.id === teamSelect.value) || teams[0];
}

function getCurrentWeekDays() {
  const week = Number(weekSelect.value);
  const year = Number(yearSelect.value);

  return [
    { label: "Montag", date: getDateFromISOWeek(year, week, 0) },
    { label: "Dienstag", date: getDateFromISOWeek(year, week, 1) },
    { label: "Mittwoch", date: getDateFromISOWeek(year, week, 2) },
    { label: "Donnerstag", date: getDateFromISOWeek(year, week, 3) },
    { label: "Freitag", date: getDateFromISOWeek(year, week, 4) }
  ].map((day) => ({
    ...day,
    displayDate: formatDisplayDate(day.date),
    isoDate: formatISODate(day.date)
  }));
}

function renderSelectionBox() {
  const team = getSelectedTeam();
  selectionBox.textContent = `${team.code} · KW ${weekSelect.value} / ${yearSelect.value}`;
}

function createTag(text) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = text;
  return span;
}

function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  const top = document.createElement("div");
  top.className = "order-top";

  const title = document.createElement("div");
  title.className = "order-title";
  title.textContent = order.title;

  const vao = document.createElement("div");
  vao.className = "vao-badge";
  vao.textContent = getVaoText(order.vaoStatus);

  top.appendChild(title);
  top.appendChild(vao);

  const address = document.createElement("div");
  address.className = "order-address";
  address.textContent = order.address;

  const tags = document.createElement("div");
  tags.className = "order-tags";

  if (order.crew) tags.appendChild(createTag(order.crew));
  if (order.quantity) tags.appendChild(createTag(order.quantity));
  if (order.klsId) tags.appendChild(createTag(order.klsId));

  card.appendChild(top);
  card.appendChild(address);
  card.appendChild(tags);

  return card;
}

function renderWeekGrid() {
  weekGrid.innerHTML = "";

  const team = getSelectedTeam();
  const days = getCurrentWeekDays();

  days.forEach((day) => {
    const column = document.createElement("section");
    column.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.innerHTML = `${day.label} <span class="day-date">${day.displayDate}</span>`;

    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "day-body";

    const pensum = document.createElement("div");
    pensum.className = "day-pensum";
    pensum.textContent = `${team.code} / Tagespensum`;
    body.appendChild(pensum);

    const dayOrders = orders.filter(
      (order) => order.teamId === team.id && order.scheduledDate === day.isoDate
    );

    if (dayOrders.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-box";
      empty.textContent = "Keine Aufträge geplant.";
      body.appendChild(empty);
    } else {
      dayOrders.forEach((order) => {
        body.appendChild(createOrderCard(order));
      });
    }

    column.appendChild(header);
    column.appendChild(body);
    weekGrid.appendChild(column);
  });
}

function openModal() {
  orderModal.classList.remove("hidden");
}

function closeModal() {
  orderModal.classList.add("hidden");
  orderForm.reset();
  orderTeam.value = teamSelect.value;
}

function setCurrentWeek() {
  const now = new Date();
  weekSelect.value = String(getISOWeek(now));
  yearSelect.value = String(getISOWeekYear(now));
}

function changeWeek(direction) {
  let week = Number(weekSelect.value);
  let year = Number(yearSelect.value);

  week += direction;

  if (week < 1) {
    year -= 1;
    week = 52;
  }

  if (week > 53) {
    year += 1;
    week = 1;
  }

  weekSelect.value = String(week);
  yearSelect.value = String(year);

  renderAll();
}

function renderAll() {
  renderSelectionBox();
  renderWeekGrid();
}

function initializeFormDefaults() {
  orderTeam.value = teamSelect.value;
  const monday = getCurrentWeekDays()[0];
  orderDate.value = monday.isoDate;
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newDate = orderDate.value;
  const dateObject = new Date(`${newDate}T00:00:00`);
  const newOrder = {
    id: crypto.randomUUID(),
    title: orderTitle.value.trim(),
    address: orderAddress.value.trim(),
    teamId: orderTeam.value,
    scheduledDate: newDate,
    crew: orderCrew.value.trim(),
    quantity: orderQuantity.value.trim(),
    klsId: orderKlsId.value.trim(),
    vaoStatus: orderVaoStatus.value,
    details: orderDetails.value.trim(),
    calendarWeek: getISOWeek(dateObject),
    year: getISOWeekYear(dateObject)
  };

  orders.push(newOrder);
  closeModal();
  renderAll();
});

teamSelect.addEventListener("change", () => {
  initializeFormDefaults();
  renderAll();
});

weekSelect.addEventListener("change", () => {
  initializeFormDefaults();
  renderAll();
});

yearSelect.addEventListener("change", () => {
  initializeFormDefaults();
  renderAll();
});

prevWeekBtn.addEventListener("click", () => changeWeek(-1));
nextWeekBtn.addEventListener("click", () => changeWeek(1));
currentWeekBtn.addEventListener("click", () => {
  setCurrentWeek();
  initializeFormDefaults();
  renderAll();
});

newOrderBtn.addEventListener("click", () => {
  initializeFormDefaults();
  openModal();
});

pdfBtn.addEventListener("click", () => {
  alert("PDF-Export kommt im nächsten Schritt.");
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

orderModal.addEventListener("click", (event) => {
  if (event.target === orderModal) {
    closeModal();
  }
});

function init() {
  fillTeamOptions();
  fillWeekOptions();
  fillYearOptions();
  setCurrentWeek();
  initializeFormDefaults();
  renderAll();
}

init();
