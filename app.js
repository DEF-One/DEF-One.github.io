const teams = [
  { id: "t1", code: "T1" },
  { id: "t2", code: "T2" },
  { id: "t3", code: "T3" },
  { id: "t4", code: "T4" },
  { id: "t5", code: "T5" },
  { id: "t6", code: "T6" },
  { id: "t7", code: "T7" },
  { id: "t8", code: "T8" }
];

const bautrupps = ["BT1", "BT2", "BT3", "BT4"];

let currentBT = "BT1";

let orders = [
  {
    id: crypto.randomUUID(),
    bt: "BT1",
    address: "Musterstraße 12, 70173 Stuttgart",
    teamId: "t1",
    scheduledDate: "2026-05-11",
    klsId: "KLS-1032",
    smNumber: "",
    vaoStatus: "nicht_gestellt",
    details: "",
    aspName: "Max Mustermann",
    aspPhone: "01701234567",
    email: "max@example.com",
    vaoStart: "2026-05-11",
    vaoEnd: "2026-05-14",
    buildingType: "EFH",
    expansionStatus: "offen",
    meters: "35",
    nvtArea: "NVT Süd",
    permit: "nein",
    baz: "nein",
    faz: "nein",
    pvsRequired: "nein",
    pvsSetupDate: "",
    completed: false,
    appointmentStart: "",
    appointmentEnd: "",
    appointmentStatus: "nicht_bestaetigt"
  }
];

let teamAdjustments = [];

const weekGrid = document.getElementById("weekGrid");
const weekDisplay = document.getElementById("weekDisplay");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const todayBtn = document.getElementById("todayBtn");

const btDropdownBtn = document.getElementById("btDropdownBtn");
const btDropdownMenu = document.getElementById("btDropdownMenu");

const weekAdjustBtn = document.getElementById("weekAdjustBtn");
const weekAdjustModal = document.getElementById("weekAdjustModal");
const closeWeekAdjustBtn = document.getElementById("closeWeekAdjustBtn");
const weekAdjustTeamList = document.getElementById("weekAdjustTeamList");
const existingAdjustmentsList = document.getElementById("existingAdjustmentsList");

const teamAdjustModal = document.getElementById("teamAdjustModal");
const teamAdjustTitle = document.getElementById("teamAdjustTitle");
const closeTeamAdjustBtn = document.getElementById("closeTeamAdjustBtn");
const cancelTeamAdjustBtn = document.getElementById("cancelTeamAdjustBtn");
const saveTeamAdjustBtn = document.getElementById("saveTeamAdjustBtn");
const teamAdjustStart = document.getElementById("teamAdjustStart");
const teamAdjustEnd = document.getElementById("teamAdjustEnd");

const liveDashboardBtn = document.getElementById("liveDashboardBtn");
const liveDashboardModal = document.getElementById("liveDashboardModal");
const closeLiveDashboardBtn = document.getElementById("closeLiveDashboardBtn");
const liveDashboardTitle = document.getElementById("liveDashboardTitle");
const liveTotalOrders = document.getElementById("liveTotalOrders");
const liveConfirmedOrders = document.getElementById("liveConfirmedOrders");
const liveOpenOrders = document.getElementById("liveOpenOrders");
const liveCompletedOrders = document.getElementById("liveCompletedOrders");
const liveConfirmedPercent = document.getElementById("liveConfirmedPercent");
const liveConfirmedProgress = document.getElementById("liveConfirmedProgress");
const liveDailyChart = document.getElementById("liveDailyChart");
const avgMetersToggle = document.getElementById("avgMetersToggle");
const absenceToggle = document.getElementById("absenceToggle");
const absenceHint = document.getElementById("absenceHint");
const missingMetersHint = document.getElementById("missingMetersHint");
const dailyChartTitle = document.getElementById("dailyChartTitle");
const dailyChartSubtitle = document.getElementById("dailyChartSubtitle");
const dailyChartLegend = document.getElementById("dailyChartLegend");
const vaoPieChart = document.getElementById("vaoPieChart");
const vaoPieLabels = document.getElementById("vaoPieLabels");
const completedTrendChart = document.getElementById("completedTrendChart");

const pdfExportBtn = document.getElementById("pdfExportBtn");
const pdfModal = document.getElementById("pdfModal");
const closePdfModalBtn = document.getElementById("closePdfModalBtn");
const cancelPdfBtn = document.getElementById("cancelPdfBtn");
const createPdfBtn = document.getElementById("createPdfBtn");
const pdfBtSelect = document.getElementById("pdfBtSelect");
const pdfDateInput = document.getElementById("pdfDateInput");

const searchInput = document.getElementById("searchInput");
const searchInfoBtn = document.getElementById("searchInfoBtn");
const searchInfoModal = document.getElementById("searchInfoModal");
const closeSearchInfoBtn = document.getElementById("closeSearchInfoBtn");

const searchResultsModal = document.getElementById("searchResultsModal");
const closeSearchResultsBtn = document.getElementById("closeSearchResultsBtn");
const searchResultsContainer = document.getElementById("searchResultsContainer");

const orderModal = document.getElementById("orderModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const orderForm = document.getElementById("orderForm");

const deleteOrderBtn = document.getElementById("deleteOrderBtn");
const deleteOrderConfirmModal = document.getElementById("deleteOrderConfirmModal");
const closeDeleteConfirmBtn = document.getElementById("closeDeleteConfirmBtn");
const cancelDeleteOrderBtn = document.getElementById("cancelDeleteOrderBtn");
const confirmDeleteOrderBtn = document.getElementById("confirmDeleteOrderBtn");

const timeModal = document.getElementById("timeModal");
const openTimeModalBtn = document.getElementById("openTimeModalBtn");
const closeTimeModalBtn = document.getElementById("closeTimeModalBtn");
const cancelTimeBtn = document.getElementById("cancelTimeBtn");
const saveTimeBtn = document.getElementById("saveTimeBtn");

const openGoogleEarthBtn = document.getElementById("openGoogleEarthBtn");
const openAppleMapsBtn = document.getElementById("openAppleMapsBtn");
const openGoogleMapsBtn = document.getElementById("openGoogleMapsBtn");
const insertSeparatorBtn = document.getElementById("insertSeparatorBtn");

const openEmailGeneratorBtn = document.getElementById("openEmailGeneratorBtn");
const emailGeneratorModal = document.getElementById("emailGeneratorModal");
const closeEmailGeneratorBtn = document.getElementById("closeEmailGeneratorBtn");
const cancelEmailGeneratorBtn = document.getElementById("cancelEmailGeneratorBtn");
const generateEmailBtn = document.getElementById("generateEmailBtn");
const emailTemplateSelect = document.getElementById("emailTemplateSelect");

const openMoveOrderBtn = document.getElementById("openMoveOrderBtn");
const moveOrderModal = document.getElementById("moveOrderModal");
const closeMoveOrderBtn = document.getElementById("closeMoveOrderBtn");
const cancelMoveOrderBtn = document.getElementById("cancelMoveOrderBtn");
const confirmMoveOrderBtn = document.getElementById("confirmMoveOrderBtn");
const moveDateInput = document.getElementById("moveDateInput");
const moveTeamSelect = document.getElementById("moveTeamSelect");
const moveLoadPreview = document.getElementById("moveLoadPreview");

const vaoMoveWarningModal = document.getElementById("vaoMoveWarningModal");
const closeVaoMoveWarningBtn = document.getElementById("closeVaoMoveWarningBtn");
const cancelVaoMoveBtn = document.getElementById("cancelVaoMoveBtn");
const confirmVaoMoveBtn = document.getElementById("confirmVaoMoveBtn");
const vaoMoveWarningText = document.getElementById("vaoMoveWarningText");

const pvsMoveChoiceModal = document.getElementById("pvsMoveChoiceModal");
const closePvsMoveChoiceBtn = document.getElementById("closePvsMoveChoiceBtn");
const pvsKeepBtn = document.getElementById("pvsKeepBtn");
const pvsDeleteBtn = document.getElementById("pvsDeleteBtn");
const pvsNewBtn = document.getElementById("pvsNewBtn");

const orderAddress = document.getElementById("orderAddress");
const orderKlsId = document.getElementById("orderKlsId");
const orderSmNumber = document.getElementById("orderSmNumber");
const orderVaoStatus = document.getElementById("orderVaoStatus");
const orderVaoStart = document.getElementById("orderVaoStart");
const orderVaoEnd = document.getElementById("orderVaoEnd");
const orderAspName = document.getElementById("orderAspName");
const orderAspPhone = document.getElementById("orderAspPhone");
const orderEmail = document.getElementById("orderEmail");
const orderBuildingType = document.getElementById("orderBuildingType");
const orderExpansionStatus = document.getElementById("orderExpansionStatus");
const orderMeters = document.getElementById("orderMeters");
const orderNvtArea = document.getElementById("orderNvtArea");
const orderDetails = document.getElementById("orderDetails");
const orderCompleted = document.getElementById("orderCompleted");

const appointmentStart = document.getElementById("appointmentStart");
const appointmentEnd = document.getElementById("appointmentEnd");
const appointmentStatus = document.getElementById("appointmentStatus");

let selectedWeek;
let selectedYear;
let activeTeamId = null;
let activeDate = null;
let editingOrderId = null;
let pendingMove = null;
let selectedAdjustTeamId = null;

let tempAppointment = {
  appointmentStart: "",
  appointmentEnd: "",
  appointmentStatus: "nicht_bestaetigt"
};

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

function formatShortDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function getTodayISODate() {
  const now = new Date();
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin"
  }).format(now);
}

function setCurrentWeek() {
  const now = new Date();
  selectedWeek = getISOWeek(now);
  selectedYear = getISOWeekYear(now);
}

function getVaoText(status) {
  switch (status) {
    case "gestellt": return "VAO gestellt";
    case "nicht_gestellt": return "VAO nicht gestellt";
    case "da": return "VAO da";
    case "nicht_noetig": return "VAO nicht nötig";
    default: return "VAO nicht gestellt";
  }
}

function getAdjustmentText(status) {
  switch (status) {
    case "krank": return "Krank";
    case "urlaub": return "Urlaub";
    case "schulung": return "Schulung";
    default: return "Anpassung";
  }
}

function getVaoDateRangeText(start, end) {
  if (!start || !end) return "";
  const startText = formatShortDate(start);
  const endText = formatShortDate(end);
  if (!startText || !endText) return "";
  return `${startText} - ${endText}`;
}

function getCurrentWeekDays() {
  return [
    { label: "Montag", shortLabel: "MO", date: getDateFromISOWeek(selectedYear, selectedWeek, 0) },
    { label: "Dienstag", shortLabel: "DI", date: getDateFromISOWeek(selectedYear, selectedWeek, 1) },
    { label: "Mittwoch", shortLabel: "MI", date: getDateFromISOWeek(selectedYear, selectedWeek, 2) },
    { label: "Donnerstag", shortLabel: "DO", date: getDateFromISOWeek(selectedYear, selectedWeek, 3) },
    { label: "Freitag", shortLabel: "FR", date: getDateFromISOWeek(selectedYear, selectedWeek, 4) }
  ].map((day) => ({
    ...day,
    displayDate: formatDisplayDate(day.date),
    isoDate: formatISODate(day.date)
  }));
}

function getWeekDaysForWeek(year, week) {
  return [0, 1, 2, 3, 4].map((offset) => formatISODate(getDateFromISOWeek(year, week, offset)));
}

function addWeeksToISOWeek(year, week, diff) {
  const monday = getDateFromISOWeek(year, week, 0);
  monday.setUTCDate(monday.getUTCDate() + diff * 7);

  return {
    week: getISOWeek(monday),
    year: getISOWeekYear(monday)
  };
}

function createTag(text) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = text;
  return span;
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "nein";
}

function setRadioValue(name, value) {
  const safeValue = value || "nein";
  const target = document.querySelector(`input[name="${name}"][value="${safeValue}"]`);
  if (target) target.checked = true;
}

function getPvsRequiredValue() {
  return getRadioValue("pvsRequired");
}

function setPvsRequiredValue(value) {
  setRadioValue("pvsRequired", value || "nein");
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function appendDetailLog(text) {
  const now = new Date();
  const timestamp = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);

  const entry = `[${timestamp}] ${text}`;
  const current = orderDetails.value.trim();

  orderDetails.value = current ? `${current}\n--------------\n${entry}` : entry;
}

function calculatePvsSetupDate(orderDateValue) {
  if (!orderDateValue) return "";

  const date = new Date(`${orderDateValue}T00:00:00`);
  date.setDate(date.getDate() - 4);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return formatISODate(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
}

function isDateOutsideVao(dateValue, vaoStart, vaoEnd) {
  if (!dateValue || !vaoStart || !vaoEnd) return false;
  return dateValue < vaoStart || dateValue > vaoEnd;
}

function parseMeters(value) {
  const meters = Number(String(value || "").replace(",", "."));
  return Number.isNaN(meters) ? null : meters;
}

function getTeamMetersForDate(teamId, dateValue, excludeOrderId = null) {
  return orders
    .filter((order) =>
      order.bt === currentBT &&
      order.teamId === teamId &&
      order.scheduledDate === dateValue &&
      order.id !== excludeOrderId
    )
    .reduce((sum, order) => {
      const meters = parseMeters(order.meters);
      return sum + (meters === null ? 0 : meters);
    }, 0);
}

function getLoadClass(meters) {
  if (meters <= 5) return "load-green";
  if (meters <= 10) return "load-yellow";
  if (meters < 20) return "load-orange";
  return "load-red";
}

function updateLinkButtonsState() {
  const hasAddress = orderAddress.value.trim().length > 0;
  const buttons = [openGoogleEarthBtn, openAppleMapsBtn, openGoogleMapsBtn];

  buttons.forEach((button) => {
    if (!button) return;
    button.classList.remove("is-disabled", "is-enabled");

    if (hasAddress) {
      button.classList.add("is-enabled");
      button.disabled = false;
    } else {
      button.classList.add("is-disabled");
      button.disabled = true;
    }
  });
}

function updateDeleteButtonVisibility() {
  if (!deleteOrderBtn) return;

  if (editingOrderId) {
    deleteOrderBtn.classList.remove("hidden");
  } else {
    deleteOrderBtn.classList.add("hidden");
  }
}

function openDeleteConfirmModal() {
  if (!editingOrderId) return;
  openModal(deleteOrderConfirmModal);
}

function deleteCurrentOrder() {
  if (!editingOrderId) return;

  orders = orders.filter((order) => order.id !== editingOrderId);

  closeModal(deleteOrderConfirmModal);
  closeOrderModal();
  renderAll();
}

function openAddressLink(type) {
  const address = orderAddress.value.trim();
  if (!address) return;

  const encodedAddress = encodeURIComponent(address);
  let url = "";

  if (type === "google-earth") url = `https://earth.google.com/web/search/${encodedAddress}`;
  if (type === "apple-maps") url = `https://maps.apple.com/?q=${encodedAddress}`;
  if (type === "google-maps") url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function insertSeparatorLine() {
  const line = "----------------------------------------";
  const currentValue = orderDetails.value || "";

  if (!currentValue.trim()) {
    orderDetails.value = `${line}\n`;
  } else if (currentValue.endsWith("\n")) {
    orderDetails.value += `${line}\n`;
  } else {
    orderDetails.value += `\n${line}\n`;
  }

  orderDetails.focus();
  orderDetails.selectionStart = orderDetails.selectionEnd = orderDetails.value.length;
}

function resetTempAppointment() {
  tempAppointment = {
    appointmentStart: "",
    appointmentEnd: "",
    appointmentStatus: "nicht_bestaetigt"
  };
}

function fillTimeModalFromTemp() {
  appointmentStart.value = tempAppointment.appointmentStart || "";
  appointmentEnd.value = tempAppointment.appointmentEnd || "";
  appointmentStatus.value = tempAppointment.appointmentStatus || "nicht_bestaetigt";
}

function openTimeModal() {
  fillTimeModalFromTemp();
  openModal(timeModal);
}

function resetFormState() {
  orderForm.reset();
  editingOrderId = null;
  activeTeamId = null;
  activeDate = null;
  orderVaoStatus.value = "nicht_gestellt";
  orderCompleted.checked = false;
  setRadioValue("permit", "nein");
  setRadioValue("baz", "nein");
  setRadioValue("faz", "nein");
  setPvsRequiredValue("nein");
  resetTempAppointment();
  updateLinkButtonsState();
  updateDeleteButtonVisibility();
}

function fillFormFromOrder(order) {
  orderAddress.value = order.address || "";
  orderKlsId.value = order.klsId || "";
  orderSmNumber.value = order.smNumber || "";
  orderVaoStatus.value = order.vaoStatus || "nicht_gestellt";
  orderVaoStart.value = order.vaoStart || "";
  orderVaoEnd.value = order.vaoEnd || "";
  orderAspName.value = order.aspName || "";
  orderAspPhone.value = order.aspPhone || "";
  orderEmail.value = order.email || "";
  orderBuildingType.value = order.buildingType || "";
  orderExpansionStatus.value = order.expansionStatus || "";
  orderMeters.value = order.meters || "";
  orderNvtArea.value = order.nvtArea || "";
  orderDetails.value = order.details || "";
  orderCompleted.checked = Boolean(order.completed);
  setRadioValue("permit", order.permit || "nein");
  setRadioValue("baz", order.baz || "nein");
  setRadioValue("faz", order.faz || "nein");
  setPvsRequiredValue(order.pvsRequired || "nein");

  tempAppointment = {
    appointmentStart: order.appointmentStart || "",
    appointmentEnd: order.appointmentEnd || "",
    appointmentStatus: order.appointmentStatus || "nicht_bestaetigt"
  };

  updateLinkButtonsState();
  updateDeleteButtonVisibility();
}

function openOrderModal(teamId, dayIsoDate) {
  resetFormState();
  activeTeamId = teamId;
  activeDate = dayIsoDate;
  updateDeleteButtonVisibility();
  openModal(orderModal);
}

function openEditOrderModal(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;

  resetFormState();
  editingOrderId = order.id;
  activeTeamId = order.teamId;
  activeDate = order.scheduledDate;
  fillFormFromOrder(order);
  updateDeleteButtonVisibility();
  openModal(orderModal);
}

function closeOrderModal() {
  closeModal(orderModal);
  resetFormState();
}

function createVaoBadge(status, start, end) {
  const badge = document.createElement("div");
  badge.className = "vao-badge";

  const main = document.createElement("div");
  main.className = "vao-badge-main";
  main.textContent = getVaoText(status);

  badge.appendChild(main);

  const dateRangeText = getVaoDateRangeText(start, end);
  if (dateRangeText) {
    const dateLine = document.createElement("div");
    dateLine.className = "vao-badge-date";
    dateLine.textContent = dateRangeText;
    badge.appendChild(dateLine);
  }

  return badge;
}

function getOrderCardStatusClass(order) {
  if (order.completed) return "status-completed";
  if (order.appointmentStatus === "bestaetigt") return "status-bestaetigt";
  if (order.appointmentStatus === "storno") return "status-storno";
  if (order.appointmentStatus === "klaerung") return "status-klaerung";
  return "";
}

function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  const statusClass = getOrderCardStatusClass(order);
  if (statusClass) card.classList.add(statusClass);

  card.addEventListener("click", () => openEditOrderModal(order.id));

  const top = document.createElement("div");
  top.className = "order-top";

  const left = document.createElement("div");
  left.className = "order-left";

  const address = document.createElement("div");
  address.className = "order-address";
  address.textContent = order.address;

  left.appendChild(address);

  if (order.completed) {
    const completedLabel = document.createElement("div");
    completedLabel.className = "order-completed-label";
    completedLabel.textContent = "FERTIGGESTELLT";
    left.appendChild(completedLabel);
  } else if (order.appointmentStatus === "storno") {
    const stornoLabel = document.createElement("div");
    stornoLabel.className = "order-storno-label";
    stornoLabel.textContent = "STORNO";
    left.appendChild(stornoLabel);
  }

  top.appendChild(left);
  top.appendChild(createVaoBadge(order.vaoStatus, order.vaoStart, order.vaoEnd));

  const tags = document.createElement("div");
  tags.className = "order-tags";

  if (order.klsId) tags.appendChild(createTag(order.klsId));
  if (order.smNumber) tags.appendChild(createTag(order.smNumber));
  if (order.meters) tags.appendChild(createTag(`${order.meters} m`));
  if (order.nvtArea) tags.appendChild(createTag(order.nvtArea));

  card.appendChild(top);
  card.appendChild(tags);

  return card;
}

function getAdjustmentForTeamAndDate(teamId, isoDate) {
  return teamAdjustments.find((adjustment) =>
    adjustment.bt === currentBT &&
    adjustment.teamId === teamId &&
    isoDate >= adjustment.startDate &&
    isoDate <= adjustment.endDate
  );
}

function createUnavailableLabel(adjustment) {
  const label = document.createElement("div");
  label.className = "team-unavailable-label";

  const statusText = getAdjustmentText(adjustment.status);
  label.innerHTML = `
    ${statusText}
    <span class="team-unavailable-until">bis ${formatDisplayDate(new Date(`${adjustment.endDate}T00:00:00`))}</span>
  `;

  return label;
}

function createTeamBlock(team, dayIsoDate) {
  const block = document.createElement("div");
  block.className = "team-block";

  const adjustment = getAdjustmentForTeamAndDate(team.id, dayIsoDate);

  if (adjustment) {
    block.classList.add("team-unavailable");
    block.appendChild(createUnavailableLabel(adjustment));
  }

  const head = document.createElement("div");
  head.className = "team-head";

  const title = document.createElement("div");
  title.className = "team-title";
  title.textContent = `${team.code} / Tagespensum`;

  const right = document.createElement("div");
  right.className = "team-head-right";

  const pensum = document.createElement("div");
  pensum.className = "team-pensum";
  pensum.textContent = "Aufträge";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-order-btn";
  addBtn.textContent = "+";
  addBtn.addEventListener("click", () => openOrderModal(team.id, dayIsoDate));

  right.appendChild(pensum);
  right.appendChild(addBtn);
  head.appendChild(title);
  head.appendChild(right);

  const ordersWrap = document.createElement("div");
  ordersWrap.className = "team-orders";

  const teamOrders = orders.filter(
    (order) =>
      order.bt === currentBT &&
      order.teamId === team.id &&
      order.scheduledDate === dayIsoDate
  );

  if (teamOrders.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-box";
    empty.textContent = "Keine Aufträge.";
    ordersWrap.appendChild(empty);
  } else {
    teamOrders.forEach((order) => ordersWrap.appendChild(createOrderCard(order)));
  }

  block.appendChild(head);
  block.appendChild(ordersWrap);

  return block;
}

function renderWeekDisplay() {
  weekDisplay.textContent = `${currentBT} · KW ${selectedWeek} / ${selectedYear}`;
}

function renderWeekGrid() {
  weekGrid.innerHTML = "";
  const days = getCurrentWeekDays();
  const todayISO = getTodayISODate();

  days.forEach((day) => {
    const column = document.createElement("section");
    column.className = "day-column";

    if (day.isoDate === todayISO) column.classList.add("current-day");

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.innerHTML = `${day.label} <span class="day-date">${day.displayDate}</span>`;

    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "day-body";

    const availableTeams = [];
    const unavailableTeams = [];

    teams.forEach((team) => {
      const adjustment = getAdjustmentForTeamAndDate(team.id, day.isoDate);
      if (adjustment) {
        unavailableTeams.push(team);
      } else {
        availableTeams.push(team);
      }
    });

    [...availableTeams, ...unavailableTeams].forEach((team) => {
      body.appendChild(createTeamBlock(team, day.isoDate));
    });

    column.appendChild(header);
    column.appendChild(body);
    weekGrid.appendChild(column);
  });
}

function renderAll() {
  renderWeekDisplay();
  renderWeekGrid();
}

function changeWeek(direction) {
  selectedWeek += direction;

  if (selectedWeek < 1) {
    selectedYear -= 1;
    selectedWeek = 52;
  }

  if (selectedWeek > 53) {
    selectedYear += 1;
    selectedWeek = 1;
  }

  renderAll();
}

function getCurrentWeekOrders() {
  const weekDates = getCurrentWeekDays().map((day) => day.isoDate);
  return orders.filter((order) => order.bt === currentBT && weekDates.includes(order.scheduledDate));
}

function getOrdersForWeek(year, week) {
  const weekDates = getWeekDaysForWeek(year, week);
  return orders.filter((order) => order.bt === currentBT && weekDates.includes(order.scheduledDate));
}

function getDayOrders(dayIsoDate) {
  return orders.filter((order) => order.bt === currentBT && order.scheduledDate === dayIsoDate);
}

function getStatusCounts(dayOrders) {
  return {
    completed: dayOrders.filter((order) => order.completed).length,
    confirmed: dayOrders.filter((order) => !order.completed && order.appointmentStatus === "bestaetigt").length,
    storno: dayOrders.filter((order) => !order.completed && order.appointmentStatus === "storno").length,
    clarify: dayOrders.filter((order) => !order.completed && order.appointmentStatus === "klaerung").length,
    open: dayOrders.filter((order) =>
      !order.completed &&
      (!order.appointmentStatus || order.appointmentStatus === "nicht_bestaetigt")
    ).length
  };
}

function getCurrentWeekAbsenceCount() {
  const weekDates = getCurrentWeekDays().map((day) => day.isoDate);
  let count = 0;

  weekDates.forEach((date) => {
    teams.forEach((team) => {
      if (getAdjustmentForTeamAndDate(team.id, date)) {
        count += 1;
      }
    });
  });

  return count;
}

function renderLiveDashboard() {
  const weekOrders = getCurrentWeekOrders();
  const total = weekOrders.length;
  const confirmed = weekOrders.filter((order) => order.appointmentStatus === "bestaetigt").length;
  const open = weekOrders.filter((order) =>
    !order.appointmentStatus || order.appointmentStatus === "nicht_bestaetigt"
  ).length;
  const completed = weekOrders.filter((order) => order.completed).length;

  const percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  liveDashboardTitle.textContent = `Live Dashboard · ${currentBT} · KW ${selectedWeek} / ${selectedYear}`;
  liveTotalOrders.textContent = total;
  liveConfirmedOrders.textContent = confirmed;
  liveOpenOrders.textContent = open;
  liveCompletedOrders.textContent = completed;
  liveConfirmedPercent.textContent = `${percent}%`;
  liveConfirmedProgress.style.width = `${percent}%`;

  renderMissingMetersHint(weekOrders);
  renderAbsenceHint();
  renderLiveDailyChart();
  renderVaoPieChart();
  renderCompletedTrendChart();
}

function renderAbsenceHint() {
  const absenceCount = getCurrentWeekAbsenceCount();

  if (absenceToggle.checked) {
    absenceHint.classList.remove("hidden");
    absenceHint.textContent = `Ausfälle: ${absenceCount}`;
  } else {
    absenceHint.classList.add("hidden");
  }
}

function renderMissingMetersHint(weekOrders) {
  const missingCount = weekOrders.filter((order) => parseMeters(order.meters) === null).length;

  if (missingCount > 0) {
    missingMetersHint.classList.remove("hidden");
    missingMetersHint.textContent = `${missingCount} Auftrag${missingCount === 1 ? "" : "e"} ohne Meterangabe`;
  } else {
    missingMetersHint.classList.add("hidden");
  }
}

function createStackSegment(count, total, className) {
  if (count <= 0 || total <= 0) return null;

  const segment = document.createElement("div");
  segment.className = `live-stack-segment ${className}`;
  segment.style.height = `${Math.max((count / total) * 100, 10)}%`;
  segment.textContent = count;

  return segment;
}

function getAverageMeters(dayOrders) {
  const validMeters = dayOrders
    .map((order) => parseMeters(order.meters))
    .filter((meters) => meters !== null);

  if (validMeters.length === 0) return null;

  const sum = validMeters.reduce((acc, meters) => acc + meters, 0);
  return sum / validMeters.length;
}

function renderLiveDailyChart() {
  if (avgMetersToggle.checked) {
    renderAverageMetersChart();
    return;
  }

  dailyChartTitle.textContent = "Tagesvergleich";
  dailyChartSubtitle.textContent = "Gesamtaufträge und Status je Tag";
  dailyChartLegend.classList.remove("hidden");

  liveDailyChart.innerHTML = "";

  const days = getCurrentWeekDays();
  const dayData = days.map((day) => {
    const dayOrders = getDayOrders(day.isoDate);
    return {
      ...day,
      total: dayOrders.length,
      counts: getStatusCounts(dayOrders)
    };
  });

  const maxTotal = Math.max(...dayData.map((day) => day.total), 1);

  dayData.forEach((day) => {
    const group = document.createElement("div");
    group.className = "live-day-group";

    const bars = document.createElement("div");
    bars.className = "live-bars";

    const totalHeight = day.total > 0 ? Math.max((day.total / maxTotal) * 260, 24) : 8;

    const totalBar = document.createElement("div");
    totalBar.className = "live-bar-total";
    totalBar.style.height = `${totalHeight}px`;

    const totalValue = document.createElement("div");
    totalValue.className = "live-bar-value";
    totalValue.textContent = day.total;
    totalBar.appendChild(totalValue);

    const stackBar = document.createElement("div");
    stackBar.className = "live-bar-stack";
    stackBar.style.height = `${totalHeight}px`;

    const openSegment = createStackSegment(day.counts.open, day.total, "segment-open");
    const clarifySegment = createStackSegment(day.counts.clarify, day.total, "segment-clarify");
    const stornoSegment = createStackSegment(day.counts.storno, day.total, "segment-storno");
    const confirmedSegment = createStackSegment(day.counts.confirmed, day.total, "segment-confirmed");
    const completedSegment = createStackSegment(day.counts.completed, day.total, "segment-completed");

    if (openSegment) stackBar.appendChild(openSegment);
    if (clarifySegment) stackBar.appendChild(clarifySegment);
    if (stornoSegment) stackBar.appendChild(stornoSegment);
    if (confirmedSegment) stackBar.appendChild(confirmedSegment);
    if (completedSegment) stackBar.appendChild(completedSegment);

    if (day.total === 0) {
      const emptySegment = document.createElement("div");
      emptySegment.className = "live-stack-segment segment-open";
      emptySegment.style.height = "100%";
      emptySegment.textContent = "0";
      stackBar.appendChild(emptySegment);
    }

    bars.appendChild(totalBar);
    bars.appendChild(stackBar);

    const label = document.createElement("div");
    label.className = "live-day-label";
    label.textContent = day.shortLabel;

    group.appendChild(bars);
    group.appendChild(label);
    liveDailyChart.appendChild(group);
  });
}

function renderAverageMetersChart() {
  dailyChartTitle.textContent = "Ø Meter je Tag";
  dailyChartSubtitle.textContent = "Nur Aufträge mit Meterangabe werden berücksichtigt";
  dailyChartLegend.classList.add("hidden");

  liveDailyChart.innerHTML = "";

  const days = getCurrentWeekDays();
  const dayData = days.map((day) => {
    const dayOrders = getDayOrders(day.isoDate);
    const average = getAverageMeters(dayOrders);

    return {
      ...day,
      average
    };
  });

  const maxAverage = Math.max(...dayData.map((day) => day.average || 0), 1);

  dayData.forEach((day) => {
    const group = document.createElement("div");
    group.className = "live-day-group";

    const bars = document.createElement("div");
    bars.className = "live-bars";

    const height = day.average !== null ? Math.max((day.average / maxAverage) * 260, 24) : 8;

    const avgBar = document.createElement("div");
    avgBar.className = "live-avg-bar";
    avgBar.style.height = `${height}px`;

    const value = document.createElement("div");
    value.className = "live-bar-value";
    value.textContent = day.average !== null ? `Ø ${Math.round(day.average)} m` : "Ø -";
    avgBar.appendChild(value);

    bars.appendChild(avgBar);

    const label = document.createElement("div");
    label.className = "live-day-label";
    label.textContent = day.shortLabel;

    group.appendChild(bars);
    group.appendChild(label);
    liveDailyChart.appendChild(group);
  });
}

function renderVaoPieChart() {
  const weekOrders = getCurrentWeekOrders();
  const counts = {
    da: weekOrders.filter((order) => order.vaoStatus === "da").length,
    gestellt: weekOrders.filter((order) => order.vaoStatus === "gestellt").length,
    nicht_gestellt: weekOrders.filter((order) => !order.vaoStatus || order.vaoStatus === "nicht_gestellt").length,
    nicht_noetig: weekOrders.filter((order) => order.vaoStatus === "nicht_noetig").length
  };

  const realTotal = Object.values(counts).reduce((acc, value) => acc + value, 0);
  const total = Math.max(realTotal, 1);

  const colors = {
    da: "#3dbb69",
    gestellt: "#4f86ff",
    nicht_gestellt: "#ff8b3d",
    nicht_noetig: "#8f96a3"
  };

  let currentPercent = 0;
  const segments = Object.entries(counts).map(([key, value]) => {
    const start = currentPercent;
    const end = start + (value / total) * 100;
    currentPercent = end;
    return `${colors[key]} ${start}% ${end}%`;
  });

  vaoPieChart.style.background = realTotal > 0
    ? `conic-gradient(${segments.join(", ")})`
    : "#e5e7eb";

  const rows = [
    { label: "Da", value: counts.da },
    { label: "Gestellt", value: counts.gestellt },
    { label: "Nicht gestellt", value: counts.nicht_gestellt },
    { label: "Nicht nötig", value: counts.nicht_noetig }
  ];

  vaoPieLabels.innerHTML = "";

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "vao-pie-row";
    item.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
    vaoPieLabels.appendChild(item);
  });
}

function renderCompletedTrendChart() {
  completedTrendChart.innerHTML = "";

  const trendWeeks = [-3, -2, -1, 0].map((diff) => {
    const weekInfo = addWeeksToISOWeek(selectedYear, selectedWeek, diff);
    const weekOrders = getOrdersForWeek(weekInfo.year, weekInfo.week);
    const completedCount = weekOrders.filter((order) => order.completed).length;

    return {
      ...weekInfo,
      label: `KW ${weekInfo.week}`,
      completedCount
    };
  });

  const maxCompleted = Math.max(...trendWeeks.map((item) => item.completedCount), 1);

  trendWeeks.forEach((item, index) => {
    const wrap = document.createElement("div");
    wrap.className = "trend-column-wrap";

    const column = document.createElement("div");
    column.className = "trend-column";
    column.style.height = `${Math.max((item.completedCount / maxCompleted) * 240, 12)}px`;

    const value = document.createElement("div");
    value.className = "trend-value";
    value.textContent = item.completedCount;
    column.appendChild(value);

    const label = document.createElement("div");
    label.className = "trend-label";
    label.textContent = item.label;

    const arrow = document.createElement("div");
    arrow.className = "trend-arrow";

    if (index === 0) {
      arrow.textContent = "•";
    } else {
      const previous = trendWeeks[index - 1].completedCount;
      if (item.completedCount > previous) arrow.textContent = "↗";
      else if (item.completedCount < previous) arrow.textContent = "↘";
      else arrow.textContent = "→";
    }

    wrap.appendChild(column);
    wrap.appendChild(label);
    wrap.appendChild(arrow);
    completedTrendChart.appendChild(wrap);
  });
}

function openLiveDashboard() {
  renderLiveDashboard();
  openModal(liveDashboardModal);
}

function renderWeekAdjustTeamList() {
  weekAdjustTeamList.innerHTML = "";

  teams.forEach((team) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "week-adjust-team-btn";
    btn.textContent = `${team.code} anpassen`;
    btn.addEventListener("click", () => openTeamAdjustModal(team.id));
    weekAdjustTeamList.appendChild(btn);
  });
}

function renderExistingAdjustments() {
  existingAdjustmentsList.innerHTML = "";

  const relevant = teamAdjustments.filter((adjustment) => adjustment.bt === currentBT);

  if (relevant.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-box";
    empty.textContent = "Keine Anpassungen vorhanden.";
    existingAdjustmentsList.appendChild(empty);
    return;
  }

  relevant.forEach((adjustment) => {
    const team = teams.find((item) => item.id === adjustment.teamId);

    const row = document.createElement("div");
    row.className = "adjustment-row";

    const main = document.createElement("div");
    main.className = "adjustment-row-main";

    const title = document.createElement("div");
    title.className = "adjustment-row-title";
    title.textContent = `${team?.code || "-"} · ${getAdjustmentText(adjustment.status)}`;

    const date = document.createElement("div");
    date.className = "adjustment-row-date";
    date.textContent = `${formatShortDate(adjustment.startDate)} - ${formatShortDate(adjustment.endDate)}`;

    main.appendChild(title);
    main.appendChild(date);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "adjustment-delete-btn";
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", () => {
      teamAdjustments = teamAdjustments.filter((item) => item.id !== adjustment.id);
      renderExistingAdjustments();
      renderAll();
    });

    row.appendChild(main);
    row.appendChild(deleteBtn);
    existingAdjustmentsList.appendChild(row);
  });
}

function openWeekAdjustModal() {
  renderWeekAdjustTeamList();
  renderExistingAdjustments();
  openModal(weekAdjustModal);
}

function openTeamAdjustModal(teamId) {
  selectedAdjustTeamId = teamId;
  const team = teams.find((item) => item.id === teamId);

  teamAdjustTitle.textContent = `${team?.code || "-"} anpassen`;
  teamAdjustStart.value = getTodayISODate();
  teamAdjustEnd.value = getTodayISODate();
  setRadioValue("teamAdjustStatus", "krank");

  openModal(teamAdjustModal);
}

function saveTeamAdjustment() {
  if (!selectedAdjustTeamId) return;

  const status = getRadioValue("teamAdjustStatus");
  const startDate = teamAdjustStart.value;
  const endDate = teamAdjustEnd.value;

  if (!startDate || !endDate) {
    alert("Bitte Start- und Enddatum auswählen.");
    return;
  }

  if (endDate < startDate) {
    alert("Das Enddatum darf nicht vor dem Startdatum liegen.");
    return;
  }

  teamAdjustments.push({
    id: crypto.randomUUID(),
    bt: currentBT,
    teamId: selectedAdjustTeamId,
    status,
    startDate,
    endDate
  });

  selectedAdjustTeamId = null;
  closeModal(teamAdjustModal);
  renderExistingAdjustments();
  renderAll();
}

function fillMoveTeamSelect() {
  moveTeamSelect.innerHTML = "";

  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.code;
    moveTeamSelect.appendChild(option);
  });
}

function renderMoveLoadPreview() {
  const selectedDate = moveDateInput.value;
  moveLoadPreview.innerHTML = "";

  if (!selectedDate) return;

  teams.forEach((team) => {
    const meters = getTeamMetersForDate(team.id, selectedDate, editingOrderId);

    const row = document.createElement("div");
    row.className = `move-load-row ${getLoadClass(meters)}`;
    row.innerHTML = `<span>${team.code}</span><span>${meters} m</span>`;

    moveLoadPreview.appendChild(row);
  });
}

function openMoveModal() {
  if (!editingOrderId) {
    alert("Du kannst einen Auftrag erst verschieben, nachdem er gespeichert wurde.");
    return;
  }

  const order = orders.find((item) => item.id === editingOrderId);
  if (!order) return;

  moveDateInput.value = order.scheduledDate;
  fillMoveTeamSelect();
  moveTeamSelect.value = order.teamId;
  renderMoveLoadPreview();
  openModal(moveOrderModal);
}

function startMoveFlow() {
  const order = orders.find((item) => item.id === editingOrderId);
  if (!order) return;

  const newDate = moveDateInput.value;
  const newTeamId = moveTeamSelect.value;

  if (!newDate || !newTeamId) {
    alert("Bitte Datum und Trupp auswählen.");
    return;
  }

  const currentTeamMeters = getTeamMetersForDate(newTeamId, newDate, order.id);
  const ownMeters = parseMeters(order.meters) || 0;
  const newTotal = currentTeamMeters + ownMeters;

  if (newTotal >= 20) {
    const proceed = confirm(`Dieser Trupp liegt mit dem Auftrag bei ${newTotal} m. Trotzdem verschieben?`);
    if (!proceed) return;
  }

  pendingMove = {
    orderId: order.id,
    oldDate: order.scheduledDate,
    oldTeamId: order.teamId,
    newDate,
    newTeamId
  };

  if (isDateOutsideVao(newDate, order.vaoStart, order.vaoEnd)) {
    vaoMoveWarningText.textContent =
      `Willst du die VAO wirklich aus dem Gültigkeitszeitraum verschieben? Sie ist noch gültig bis zum ${formatShortDate(order.vaoEnd)}.`;

    closeModal(moveOrderModal);
    openModal(vaoMoveWarningModal);
    return;
  }

  continueMoveAfterVao();
}

function continueMoveAfterVao() {
  closeModal(vaoMoveWarningModal);

  const order = orders.find((item) => item.id === pendingMove?.orderId);
  if (!order || !pendingMove) return;

  if (order.pvsRequired === "ja" && order.pvsSetupDate) {
    openModal(pvsMoveChoiceModal);
    return;
  }

  applyMove("none");
}

function applyMove(pvsAction) {
  const order = orders.find((item) => item.id === pendingMove?.orderId);
  if (!order || !pendingMove) return;

  const oldTeam = teams.find((team) => team.id === pendingMove.oldTeamId)?.code || "-";
  const newTeam = teams.find((team) => team.id === pendingMove.newTeamId)?.code || "-";

  order.scheduledDate = pendingMove.newDate;
  order.teamId = pendingMove.newTeamId;

  if (pvsAction === "keep") {
    appendDetailLog(`Auftrag verschoben von ${oldTeam} / ${pendingMove.oldDate} nach ${newTeam} / ${pendingMove.newDate}. PVS bleibt am bisherigen Aufstellungstag ${order.pvsSetupDate}.`);
  } else if (pvsAction === "delete") {
    order.pvsRequired = "nein";
    order.pvsSetupDate = "";
    appendDetailLog(`Auftrag verschoben von ${oldTeam} / ${pendingMove.oldDate} nach ${newTeam} / ${pendingMove.newDate}. PVS wurde gelöscht.`);
  } else if (pvsAction === "new") {
    order.pvsRequired = "ja";
    order.pvsSetupDate = calculatePvsSetupDate(pendingMove.newDate);
    appendDetailLog(`Auftrag verschoben von ${oldTeam} / ${pendingMove.oldDate} nach ${newTeam} / ${pendingMove.newDate}. PVS neu berechnet für ${order.pvsSetupDate}.`);
  } else {
    appendDetailLog(`Auftrag verschoben von ${oldTeam} / ${pendingMove.oldDate} nach ${newTeam} / ${pendingMove.newDate}.`);
  }

  closeModal(pvsMoveChoiceModal);
  closeModal(moveOrderModal);

  fillFormFromOrder(order);
  renderAll();
  pendingMove = null;
}

function saveOrderFromForm() {
  if (editingOrderId) {
    const existingOrder = orders.find((item) => item.id === editingOrderId);
    if (!existingOrder) return;

    existingOrder.bt = existingOrder.bt || currentBT;
    existingOrder.address = orderAddress.value.trim();
    existingOrder.klsId = orderKlsId.value.trim();
    existingOrder.smNumber = orderSmNumber.value.trim();
    existingOrder.vaoStatus = orderVaoStatus.value || "nicht_gestellt";
    existingOrder.details = orderDetails.value.trim();
    existingOrder.aspName = orderAspName.value.trim();
    existingOrder.aspPhone = orderAspPhone.value.trim();
    existingOrder.email = orderEmail.value.trim();
    existingOrder.vaoStart = orderVaoStart.value;
    existingOrder.vaoEnd = orderVaoEnd.value;
    existingOrder.buildingType = orderBuildingType.value.trim();
    existingOrder.expansionStatus = orderExpansionStatus.value.trim();
    existingOrder.meters = orderMeters.value.trim();
    existingOrder.nvtArea = orderNvtArea.value.trim();
    existingOrder.permit = getRadioValue("permit");
    existingOrder.baz = getRadioValue("baz");
    existingOrder.faz = getRadioValue("faz");
    existingOrder.pvsRequired = getPvsRequiredValue();
    existingOrder.pvsSetupDate =
      existingOrder.pvsRequired === "ja"
        ? calculatePvsSetupDate(existingOrder.scheduledDate)
        : "";
    existingOrder.completed = orderCompleted.checked;
    existingOrder.appointmentStart = tempAppointment.appointmentStart;
    existingOrder.appointmentEnd = tempAppointment.appointmentEnd;
    existingOrder.appointmentStatus = tempAppointment.appointmentStatus;
  } else {
    const pvsRequired = getPvsRequiredValue();

    orders.push({
      id: crypto.randomUUID(),
      bt: currentBT,
      address: orderAddress.value.trim(),
      teamId: activeTeamId,
      scheduledDate: activeDate,
      klsId: orderKlsId.value.trim(),
      smNumber: orderSmNumber.value.trim(),
      vaoStatus: orderVaoStatus.value || "nicht_gestellt",
      details: orderDetails.value.trim(),
      aspName: orderAspName.value.trim(),
      aspPhone: orderAspPhone.value.trim(),
      email: orderEmail.value.trim(),
      vaoStart: orderVaoStart.value,
      vaoEnd: orderVaoEnd.value,
      buildingType: orderBuildingType.value.trim(),
      expansionStatus: orderExpansionStatus.value.trim(),
      meters: orderMeters.value.trim(),
      nvtArea: orderNvtArea.value.trim(),
      permit: getRadioValue("permit"),
      baz: getRadioValue("baz"),
      faz: getRadioValue("faz"),
      pvsRequired,
      pvsSetupDate: pvsRequired === "ja" ? calculatePvsSetupDate(activeDate) : "",
      completed: orderCompleted.checked,
      appointmentStart: tempAppointment.appointmentStart,
      appointmentEnd: tempAppointment.appointmentEnd,
      appointmentStatus: tempAppointment.appointmentStatus || "nicht_bestaetigt"
    });
  }

  closeOrderModal();
  renderAll();
}

function normalizeSearchValue(value) {
  return (value || "").toString().trim().toLowerCase();
}

function getWeekInfoForDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return {
    week: getISOWeek(date),
    year: getISOWeekYear(date)
  };
}

function performSearch() {
  const query = normalizeSearchValue(searchInput.value);
  if (!query) return;

  const results = orders
    .filter((order) => [
      order.address,
      order.klsId,
      order.smNumber,
      order.aspName,
      order.email,
      order.nvtArea
    ].some((field) => normalizeSearchValue(field).includes(query)))
    .map((order) => {
      const team = teams.find((teamItem) => teamItem.id === order.teamId);
      const weekInfo = getWeekInfoForDate(order.scheduledDate);
      return {
        order,
        teamCode: team ? team.code : "-",
        bt: order.bt || "-",
        week: weekInfo.week,
        year: weekInfo.year
      };
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.order.scheduledDate}T00:00:00`).getTime();
      const dateB = new Date(`${b.order.scheduledDate}T00:00:00`).getTime();
      return dateB - dateA;
    });

  renderSearchResults(results);
  openModal(searchResultsModal);
}

function renderSearchResults(results) {
  searchResultsContainer.innerHTML = "";

  if (results.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-box";
    empty.textContent = "Zu deiner Suchanfrage konnte ich leider nichts finden.";
    searchResultsContainer.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "search-result-list";

  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "search-result-card";

    card.innerHTML = `
      <div class="search-result-title">${result.order.address || "-"}</div>
      <div class="search-result-meta">
        <div><strong>KLS-ID:</strong> ${result.order.klsId || "-"}</div>
        <div><strong>SM-Nummer:</strong> ${result.order.smNumber || "-"}</div>
        <div><strong>Trupp:</strong> ${result.teamCode}</div>
        <div><strong>Datum:</strong> ${formatDisplayDate(new Date(`${result.order.scheduledDate}T00:00:00`))}</div>
        <div><strong>KW/Jahr:</strong> KW ${result.week} / ${result.year}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      currentBT = result.bt;
      selectedWeek = result.week;
      selectedYear = result.year;
      closeModal(searchResultsModal);
      renderAll();

      setTimeout(() => openEditOrderModal(result.order.id), 120);
    });

    list.appendChild(card);
  });

  searchResultsContainer.appendChild(list);
}

function openPdfModal() {
  pdfBtSelect.value = currentBT;
  pdfDateInput.value = getTodayISODate();
  openModal(pdfModal);
}

function handlePdfCreate() {
  const selectedPdfBT = pdfBtSelect.value;
  const selectedDate = pdfDateInput.value;

  if (!selectedDate) {
    alert("Bitte ein Datum auswählen.");
    return;
  }

  const dayOrders = orders.filter(
    (order) => order.bt === selectedPdfBT && order.scheduledDate === selectedDate
  );

  if (dayOrders.length === 0) {
    alert("Für den gewählten Tag und BT gibt es keine Aufträge.");
    return;
  }

  window.print();
}

function handleBtSelection(btValue) {
  currentBT = btValue;
  setCurrentWeek();
  closeModal(btDropdownMenu);
  renderAll();
}

function openEmailGenerator() {
  openModal(emailGeneratorModal);
}

function generateEmailPlaceholder() {
  const emailAddress = orderEmail.value.trim() || "keine E-Mail-Adresse";
  const template = emailTemplateSelect.value || "keine Vorlage ausgewählt";

  appendDetailLog(`E-Mail Generator geöffnet. Vorlage: ${template}. Empfänger: ${emailAddress}.`);

  closeModal(emailGeneratorModal);
}

function initBtDropdown() {
  if (!btDropdownMenu) return;

  const existingItems = btDropdownMenu.querySelectorAll(".dropdown-item");
  if (existingItems.length === bautrupps.length) return;

  btDropdownMenu.innerHTML = "";
  bautrupps.forEach((bt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dropdown-item";
    btn.dataset.bt = bt;
    btn.textContent = bt;
    btn.addEventListener("click", () => handleBtSelection(bt));
    btDropdownMenu.appendChild(btn);
  });
}

function initPdfDropdown() {
  if (!pdfBtSelect) return;

  pdfBtSelect.innerHTML = "";
  bautrupps.forEach((bt) => {
    const option = document.createElement("option");
    option.value = bt;
    option.textContent = bt;
    pdfBtSelect.appendChild(option);
  });
}

weekAdjustBtn.addEventListener("click", openWeekAdjustModal);
closeWeekAdjustBtn.addEventListener("click", () => closeModal(weekAdjustModal));
closeTeamAdjustBtn.addEventListener("click", () => closeModal(teamAdjustModal));
cancelTeamAdjustBtn.addEventListener("click", () => closeModal(teamAdjustModal));
saveTeamAdjustBtn.addEventListener("click", saveTeamAdjustment);

liveDashboardBtn.addEventListener("click", openLiveDashboard);
closeLiveDashboardBtn.addEventListener("click", () => closeModal(liveDashboardModal));
avgMetersToggle.addEventListener("change", renderLiveDashboard);
absenceToggle.addEventListener("change", renderLiveDashboard);

openTimeModalBtn.addEventListener("click", openTimeModal);
closeTimeModalBtn.addEventListener("click", () => closeModal(timeModal));
cancelTimeBtn.addEventListener("click", () => closeModal(timeModal));
saveTimeBtn.addEventListener("click", () => {
  tempAppointment.appointmentStart = appointmentStart.value;
  tempAppointment.appointmentEnd = appointmentEnd.value;
  tempAppointment.appointmentStatus = appointmentStatus.value || "nicht_bestaetigt";
  closeModal(timeModal);
});

openGoogleEarthBtn.addEventListener("click", () => openAddressLink("google-earth"));
openAppleMapsBtn.addEventListener("click", () => openAddressLink("apple-maps"));
openGoogleMapsBtn.addEventListener("click", () => openAddressLink("google-maps"));

orderAddress.addEventListener("input", updateLinkButtonsState);
insertSeparatorBtn.addEventListener("click", insertSeparatorLine);

deleteOrderBtn.addEventListener("click", openDeleteConfirmModal);
closeDeleteConfirmBtn.addEventListener("click", () => closeModal(deleteOrderConfirmModal));
cancelDeleteOrderBtn.addEventListener("click", () => closeModal(deleteOrderConfirmModal));
confirmDeleteOrderBtn.addEventListener("click", deleteCurrentOrder);

openEmailGeneratorBtn.addEventListener("click", openEmailGenerator);
closeEmailGeneratorBtn.addEventListener("click", () => closeModal(emailGeneratorModal));
cancelEmailGeneratorBtn.addEventListener("click", () => closeModal(emailGeneratorModal));
generateEmailBtn.addEventListener("click", generateEmailPlaceholder);

openMoveOrderBtn.addEventListener("click", openMoveModal);
closeMoveOrderBtn.addEventListener("click", () => closeModal(moveOrderModal));
cancelMoveOrderBtn.addEventListener("click", () => closeModal(moveOrderModal));
confirmMoveOrderBtn.addEventListener("click", startMoveFlow);
moveDateInput.addEventListener("change", renderMoveLoadPreview);

closeVaoMoveWarningBtn.addEventListener("click", () => {
  pendingMove = null;
  closeModal(vaoMoveWarningModal);
});
cancelVaoMoveBtn.addEventListener("click", () => {
  pendingMove = null;
  closeModal(vaoMoveWarningModal);
});
confirmVaoMoveBtn.addEventListener("click", continueMoveAfterVao);

closePvsMoveChoiceBtn.addEventListener("click", () => {
  pendingMove = null;
  closeModal(pvsMoveChoiceModal);
});
pvsKeepBtn.addEventListener("click", () => applyMove("keep"));
pvsDeleteBtn.addEventListener("click", () => applyMove("delete"));
pvsNewBtn.addEventListener("click", () => applyMove("new"));

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveOrderFromForm();
});

prevWeekBtn.addEventListener("click", () => changeWeek(-1));
nextWeekBtn.addEventListener("click", () => changeWeek(1));
todayBtn.addEventListener("click", () => {
  setCurrentWeek();
  renderAll();
});

closeModalBtn.addEventListener("click", closeOrderModal);
cancelBtn.addEventListener("click", closeOrderModal);

btDropdownBtn.addEventListener("click", () => {
  btDropdownMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  const insideBtWrap = event.target.closest(".bt-select-wrap");
  if (!insideBtWrap && !btDropdownMenu.classList.contains("hidden")) {
    btDropdownMenu.classList.add("hidden");
  }
});

searchInfoBtn.addEventListener("click", () => openModal(searchInfoModal));
closeSearchInfoBtn.addEventListener("click", () => closeModal(searchInfoModal));
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") performSearch();
});
closeSearchResultsBtn.addEventListener("click", () => closeModal(searchResultsModal));

pdfExportBtn.addEventListener("click", openPdfModal);
closePdfModalBtn.addEventListener("click", () => closeModal(pdfModal));
cancelPdfBtn.addEventListener("click", () => closeModal(pdfModal));
createPdfBtn.addEventListener("click", handlePdfCreate);

[
  liveDashboardModal,
  weekAdjustModal,
  teamAdjustModal,
  timeModal,
  orderModal,
  searchInfoModal,
  searchResultsModal,
  pdfModal,
  emailGeneratorModal,
  moveOrderModal,
  vaoMoveWarningModal,
  pvsMoveChoiceModal,
  deleteOrderConfirmModal
].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

function init() {
  setCurrentWeek();
  initBtDropdown();
  initPdfDropdown();
  updateLinkButtonsState();
  updateDeleteButtonVisibility();
  renderAll();
}

init();
