const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
const DAY_SHORT = ["MO", "DI", "MI", "DO", "FR"];
const TEAMS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
const BTS = ["BT1", "BT2", "BT3", "BT4"];

const EXPORT_FIELDS = [
  { key: "address", label: "Adresse" },
  { key: "klsId", label: "KLS-ID" },
  { key: "smNumber", label: "SM-Nummer" },
  { key: "aspName", label: "ASP" },
  { key: "aspPhone", label: "ASP-Rufnummer" },
  { key: "email", label: "E-Mail" },
  { key: "expansionStatus", label: "Ausbau-Status" },
  { key: "buildingType", label: "Gebäudetyp" },
  { key: "meters", label: "Meter" },
  { key: "nvtArea", label: "NVT-Bereich" },
  { key: "waitingReason", label: "Wartegrund" }
];

let currentBT = "BT1";
let currentDate = new Date();
let dailyViewDate = null;
let currentMainView = "week";
let currentPoolView = "vao";

let draggedOrderId = null;
let draggedExportFieldKey = null;

let editingOrderId = null;
let createTarget = null;

let pendingCompletedOrderId = null;
let pendingEffortOrderId = null;

let pendingMoveOrderId = null;
let pendingMoveData = null;
let pendingMoveSource = "button";

let selectedAdjustTeam = null;

let pendingVaoReserveOrderId = null;
let pendingVaoCompleteOrderId = null;
let pendingControlCompleteOrderId = null;
let pendingPlanningPoolOrderId = null;

let exportColumnsState = [];

let tempAppointment = {
  start: "",
  end: "",
  status: "nicht_bestaetigt",
  waitingReason: ""
};

let orders = [
  {
    id: crypto.randomUUID(),
    bt: "BT1",
    team: "T1",
    date: getIsoDate(new Date()),
    address: "Musterstraße 12, 70173 Stuttgart",
    klsId: "KLS-1032",
    smNumber: "SM-001",
    aspName: "Max Mustermann",
    aspPhone: "01701234567",
    email: "max@example.com",
    expansionStatus: "offen",
    buildingType: "EFH",
    meters: "12",
    nvtArea: "NVT Süd",
    vaoStatus: "nicht_gestellt",
    vaoStart: "",
    vaoEnd: "",
    permit: "nein",
    baz: "nein",
    faz: "nein",
    pvsRequired: "nein",
    pvsSetupDate: "",
    details: "",
    appointmentStart: "",
    appointmentEnd: "",
    appointmentStatus: "nicht_bestaetigt",
    waitingReason: "",
    completed: false,
    blownIn: false,
    effortType: "",
    vaoReservedBy: "",
    vaoReservedAt: "",
    vaoProcessing: false,
    sourceStage: "daily",
    controlProcessing: false,
    controlReservedBy: "",
    controlReservedAt: "",
    controlData: null
  },
  {
    id: crypto.randomUUID(),
    bt: "BT1",
    team: "",
    date: "",
    address: "TEST",
    klsId: "TEST-KLS",
    smNumber: "",
    aspName: "",
    aspPhone: "",
    email: "",
    expansionStatus: "",
    buildingType: "",
    meters: "",
    nvtArea: "",
    vaoStatus: "nicht_gestellt",
    vaoStart: "",
    vaoEnd: "",
    permit: "nein",
    baz: "nein",
    faz: "nein",
    pvsRequired: "nein",
    pvsSetupDate: "",
    details: "",
    appointmentStart: "",
    appointmentEnd: "",
    appointmentStatus: "nicht_bestaetigt",
    waitingReason: "",
    completed: false,
    blownIn: false,
    effortType: "",
    vaoReservedBy: "",
    vaoReservedAt: "",
    vaoProcessing: false,
    sourceStage: "control_pool",
    controlProcessing: false,
    controlReservedBy: "",
    controlReservedAt: "",
    controlData: null
  }
];

let teamAdjustments = [];

/* DOM */

const mainTitle = document.getElementById("mainTitle");
const mainSubtitle = document.getElementById("mainSubtitle");

const weekView = document.getElementById("weekView");
const weekGrid = document.getElementById("weekGrid");
const weekDisplay = document.getElementById("weekDisplay");

const vaoOpenMainView = document.getElementById("vaoOpenMainView");
const vaoOpenListBtn = document.getElementById("vaoOpenListBtn");
const vaoOpenListContainer = document.getElementById("vaoOpenListContainer");
const vaoTodoListContainer = document.getElementById("vaoTodoListContainer");

const poolViewTitle = document.getElementById("poolViewTitle");
const poolViewSubtitle = document.getElementById("poolViewSubtitle");
const poolViewSwitchBtn = document.getElementById("poolViewSwitchBtn");
const poolTodoTitle = document.getElementById("poolTodoTitle");
const poolTodoSubtitle = document.getElementById("poolTodoSubtitle");

const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const todayBtn = document.getElementById("todayBtn");
const backToWeekBtn = document.getElementById("backToWeekBtn");

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
const activeBtCount = document.getElementById("activeBtCount");

const liveTotalOrders = document.getElementById("liveTotalOrders");
const liveConfirmedOrders = document.getElementById("liveConfirmedOrders");
const liveOpenOrders = document.getElementById("liveOpenOrders");
const liveCompletedOrders = document.getElementById("liveCompletedOrders");
const liveBlownInOrders = document.getElementById("liveBlownInOrders");
const liveEffortOrders = document.getElementById("liveEffortOrders");
const liveConfirmedPercent = document.getElementById("liveConfirmedPercent");
const liveConfirmedProgress = document.getElementById("liveConfirmedProgress");

const avgMetersToggle = document.getElementById("avgMetersToggle");
const absenceToggle = document.getElementById("absenceToggle");
const liveUnaToggle = document.getElementById("liveUnaToggle");
const absenceHint = document.getElementById("absenceHint");
const missingMetersHint = document.getElementById("missingMetersHint");

const liveDailyChart = document.getElementById("liveDailyChart");
const vaoPieChart = document.getElementById("vaoPieChart");
const vaoPieLabels = document.getElementById("vaoPieLabels");
const completedTrendChart = document.getElementById("completedTrendChart");

const orderModal = document.getElementById("orderModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const orderForm = document.getElementById("orderForm");

const deleteOrderBtn = document.getElementById("deleteOrderBtn");
const deleteOrderConfirmModal = document.getElementById("deleteOrderConfirmModal");
const closeDeleteConfirmBtn = document.getElementById("closeDeleteConfirmBtn");
const cancelDeleteOrderBtn = document.getElementById("cancelDeleteOrderBtn");
const confirmDeleteOrderBtn = document.getElementById("confirmDeleteOrderBtn");

const completedQuestionModal = document.getElementById("completedQuestionModal");
const closeCompletedQuestionBtn = document.getElementById("closeCompletedQuestionBtn");
const completedNoBtn = document.getElementById("completedNoBtn");
const completedYesBtn = document.getElementById("completedYesBtn");

const effortModal = document.getElementById("effortModal");
const closeEffortModalBtn = document.getElementById("closeEffortModalBtn");
const cancelEffortBtn = document.getElementById("cancelEffortBtn");
const saveEffortBtn = document.getElementById("saveEffortBtn");
const clearEffortBtn = document.getElementById("clearEffortBtn");
const openEffortBtn = document.getElementById("openEffortBtn");

const orderAddress = document.getElementById("orderAddress");
const orderKlsId = document.getElementById("orderKlsId");
const orderSmNumber = document.getElementById("orderSmNumber");
const orderAspName = document.getElementById("orderAspName");
const orderAspPhone = document.getElementById("orderAspPhone");
const orderEmail = document.getElementById("orderEmail");
const orderExpansionStatus = document.getElementById("orderExpansionStatus");
const orderBuildingType = document.getElementById("orderBuildingType");
const orderMeters = document.getElementById("orderMeters");
const orderNvtArea = document.getElementById("orderNvtArea");
const orderCompleted = document.getElementById("orderCompleted");
const orderVaoStatus = document.getElementById("orderVaoStatus");
const orderVaoStart = document.getElementById("orderVaoStart");
const orderVaoEnd = document.getElementById("orderVaoEnd");
const orderDetails = document.getElementById("orderDetails");
const insertSeparatorBtn = document.getElementById("insertSeparatorBtn");

const timeModal = document.getElementById("timeModal");
const openTimeModalBtn = document.getElementById("openTimeModalBtn");
const closeTimeModalBtn = document.getElementById("closeTimeModalBtn");
const cancelTimeBtn = document.getElementById("cancelTimeBtn");
const saveTimeBtn = document.getElementById("saveTimeBtn");
const appointmentStart = document.getElementById("appointmentStart");
const appointmentEnd = document.getElementById("appointmentEnd");
const appointmentStatus = document.getElementById("appointmentStatus");
const waitingReasonWrap = document.getElementById("waitingReasonWrap");
const waitingReasonSelect = document.getElementById("waitingReasonSelect");

const openGoogleEarthBtn = document.getElementById("openGoogleEarthBtn");
const openAppleMapsBtn = document.getElementById("openAppleMapsBtn");
const openGoogleMapsBtn = document.getElementById("openGoogleMapsBtn");

const searchInput = document.getElementById("searchInput");
const searchInfoBtn = document.getElementById("searchInfoBtn");
const searchInfoModal = document.getElementById("searchInfoModal");
const closeSearchInfoBtn = document.getElementById("closeSearchInfoBtn");
const searchResultsModal = document.getElementById("searchResultsModal");
const closeSearchResultsBtn = document.getElementById("closeSearchResultsBtn");
const searchResultsContainer = document.getElementById("searchResultsContainer");

const pdfExportBtn = document.getElementById("pdfExportBtn");
const pdfModal = document.getElementById("pdfModal");
const closePdfModalBtn = document.getElementById("closePdfModalBtn");
const cancelPdfBtn = document.getElementById("cancelPdfBtn");
const createPdfBtn = document.getElementById("createPdfBtn");
const pdfBtSelect = document.getElementById("pdfBtSelect");
const pdfDateInput = document.getElementById("pdfDateInput");

const emailGeneratorModal = document.getElementById("emailGeneratorModal");
const openEmailGeneratorBtn = document.getElementById("openEmailGeneratorBtn");
const closeEmailGeneratorBtn = document.getElementById("closeEmailGeneratorBtn");
const cancelEmailGeneratorBtn = document.getElementById("cancelEmailGeneratorBtn");
const generateEmailBtn = document.getElementById("generateEmailBtn");
const emailTemplateSelect = document.getElementById("emailTemplateSelect");

const moveOrderModal = document.getElementById("moveOrderModal");
const openMoveOrderBtn = document.getElementById("openMoveOrderBtn");
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

const vaoReserveConfirmModal = document.getElementById("vaoReserveConfirmModal");
const closeVaoReserveConfirmBtn = document.getElementById("closeVaoReserveConfirmBtn");
const cancelVaoReserveBtn = document.getElementById("cancelVaoReserveBtn");
const confirmVaoReserveBtn = document.getElementById("confirmVaoReserveBtn");

const vaoCompleteModal = document.getElementById("vaoCompleteModal");
const closeVaoCompleteModalBtn = document.getElementById("closeVaoCompleteModalBtn");
const cancelVaoCompleteBtn = document.getElementById("cancelVaoCompleteBtn");
const saveVaoCompleteBtn = document.getElementById("saveVaoCompleteBtn");
const vaoCompleteStart = document.getElementById("vaoCompleteStart");
const vaoCompleteEnd = document.getElementById("vaoCompleteEnd");
const vaoCompleteMeters = document.getElementById("vaoCompleteMeters");

const controlCompleteModal = document.getElementById("controlCompleteModal");
const closeControlCompleteBtn = document.getElementById("closeControlCompleteBtn");
const cancelControlCompleteBtn = document.getElementById("cancelControlCompleteBtn");
const saveControlCompleteBtn = document.getElementById("saveControlCompleteBtn");
const controlCompleteSubtitle = document.getElementById("controlCompleteSubtitle");
const controlDokuFeedback = document.getElementById("controlDokuFeedback");
const controlGeneratedText = document.getElementById("controlGeneratedText");

const poolPlanningBtn = document.getElementById("poolPlanningBtn");
const poolPlanningCount = document.getElementById("poolPlanningCount");
const planningPoolModal = document.getElementById("planningPoolModal");
const closePlanningPoolBtn = document.getElementById("closePlanningPoolBtn");
const planningPoolList = document.getElementById("planningPoolList");

const planningPoolScheduleModal = document.getElementById("planningPoolScheduleModal");
const closePlanningPoolScheduleBtn = document.getElementById("closePlanningPoolScheduleBtn");
const cancelPlanningPoolScheduleBtn = document.getElementById("cancelPlanningPoolScheduleBtn");
const confirmPlanningPoolScheduleBtn = document.getElementById("confirmPlanningPoolScheduleBtn");
const planningPoolScheduleSubtitle = document.getElementById("planningPoolScheduleSubtitle");
const planningPoolDateInput = document.getElementById("planningPoolDateInput");
const planningPoolTeamSelect = document.getElementById("planningPoolTeamSelect");
const planningPoolLoadPreview = document.getElementById("planningPoolLoadPreview");

const exportBuilderBtn = document.getElementById("exportBuilderBtn");
const exportBuilderModal = document.getElementById("exportBuilderModal");
const closeExportBuilderBtn = document.getElementById("closeExportBuilderBtn");
const exportWeekLabel = document.getElementById("exportWeekLabel");
const exportFieldBlocks = document.getElementById("exportFieldBlocks");
const exportColumns = document.getElementById("exportColumns");
const exportPreview = document.getElementById("exportPreview");
const clearExportColumnsBtn = document.getElementById("clearExportColumnsBtn");
const downloadExportBtn = document.getElementById("downloadExportBtn");

/* HELPERS */

function openModal(modal) {
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (modal) modal.classList.add("hidden");
}

function getIsoDate(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split("T")[0];
}

function makeDate(iso) {
  if (!iso) return new Date();
  return new Date(`${iso}T00:00:00`);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatShortDateFromIso(iso) {
  if (!iso) return "";

  const date = makeDate(iso);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function formatDateTimeNow() {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;

  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);

  return d;
}

function getISOWeek(date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;

  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));

  return Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
}

function getWeekDays(baseDate = currentDate) {
  const monday = getMonday(baseDate);

  return DAYS.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      name,
      short: DAY_SHORT[index],
      date,
      iso: getIsoDate(date)
    };
  });
}

function getWeekLabel() {
  return `KW ${getISOWeek(currentDate)} / ${currentDate.getFullYear()}`;
}

function getCurrentWeekDates() {
  return getWeekDays().map((day) => day.iso);
}

function parseMeters(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isNaN(number) ? null : number;
}

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "nein";
}

function setRadioValue(name, value) {
  const input = document.querySelector(`input[name="${name}"][value="${value || "nein"}"]`);
  if (input) input.checked = true;
}

function safeText(value) {
  return String(value || "").trim();
}

function lower(value) {
  return safeText(value).toLowerCase();
}

function getCurrentUserLabel() {
  return "Disponent";
}

function canUnlockReservation(order) {
  return order.vaoReservedBy === getCurrentUserLabel();
}

function canUnlockControlReservation(order) {
  return order.controlReservedBy === getCurrentUserLabel();
}

function getControlCategoryText(value) {
  if (value === "klein") return "Klein";
  if (value === "mittel") return "Mittel";
  if (value === "gross") return "Groß";
  if (value === "planung") return "Planung";
  if (value === "nacharbeit") return "Nacharbeit";
  if (value === "klaerung") return "Klärung";
  if (value === "nicht_umsetzbar") return "Nicht umsetzbar";
  return "";
}

function getVaoText(status) {
  if (status === "gestellt") return "VAO gestellt";
  if (status === "da") return "VAO da";
  if (status === "nicht_noetig") return "VAO nicht nötig";
  return "VAO nicht gestellt";
}

function getEffortText(type) {
  if (type === "asphalt") return "ASPHALT";
  if (type === "pflaster") return "PFLASTER";
  if (type === "nacharbeit") return "NACHARBEIT";
  return "";
}

function getAppointmentText(status) {
  if (status === "bestaetigt") return "Bestätigt";
  if (status === "storno") return "Storno";
  if (status === "klaerung") return "Klärung";
  if (status === "wartegrund") return "Wartegrund";
  return "Offen";
}

function getAppointmentBubbleClass(status) {
  if (status === "bestaetigt") return "bubble-confirmed";
  if (status === "storno") return "bubble-storno";
  if (status === "klaerung") return "bubble-klaerung";
  if (status === "wartegrund") return "bubble-waiting";
  return "bubble-open";
}

function getAdjustmentText(status) {
  if (status === "krank") return "KRANK";
  if (status === "urlaub") return "URLAUB";
  if (status === "schulung") return "SCHULUNG";
  return "ANPASSUNG";
}

function getOrderStatusClass(order) {
  if (order.completed) return "completed-card";

  if (order.appointmentStatus === "bestaetigt") return "appointment-confirmed-card";
  if (order.appointmentStatus === "storno") return "appointment-storno-card";
  if (order.appointmentStatus === "klaerung") return "appointment-clarify-card";
  if (order.appointmentStatus === "wartegrund") return "appointment-waiting-card";

  if (order.vaoProcessing) return "current-processing";
  if (order.effortType) return "effort-card";

  return "";
}

function calculatePvsSetupDate(orderDateIso) {
  if (!orderDateIso) return "";

  const date = makeDate(orderDateIso);
  date.setDate(date.getDate() - 4);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return getIsoDate(date);
}

function getOrdersForScope() {
  const weekDates = getCurrentWeekDates();

  return orders.filter((order) => {
    if (!weekDates.includes(order.date)) return false;
    if (order.sourceStage === "control_pool") return false;
    if (order.sourceStage === "planning_pool") return false;
    if (liveUnaToggle.checked) return true;
    return order.bt === currentBT;
  });
}

function getVisibleOrdersForDayAndTeam(dayIso, team) {
  return orders.filter((order) =>
    order.bt === currentBT &&
    order.date === dayIso &&
    order.team === team &&
    order.sourceStage !== "control_pool" &&
    order.sourceStage !== "planning_pool"
  );
}

function getTeamMeters(dayIso, team, excludeOrderId = null) {
  return orders
    .filter((order) =>
      order.bt === currentBT &&
      order.date === dayIso &&
      order.team === team &&
      order.id !== excludeOrderId &&
      order.sourceStage !== "control_pool" &&
      order.sourceStage !== "planning_pool"
    )
    .reduce((sum, order) => {
      const meters = parseMeters(order.meters);
      return sum + (meters || 0);
    }, 0);
}

function hasEffortOnTeam(dayIso, team, excludeOrderId = null) {
  return orders.some((order) =>
    order.bt === currentBT &&
    order.date === dayIso &&
    order.team === team &&
    order.id !== excludeOrderId &&
    order.sourceStage !== "control_pool" &&
    order.sourceStage !== "planning_pool" &&
    Boolean(order.effortType)
  );
}

function getMoveLoadClass(meters) {
  if (meters <= 5) return "move-green";
  if (meters <= 15) return "move-yellow";
  return "move-red";
}

function getAdjustment(dayIso, team) {
  return teamAdjustments.find((item) =>
    item.bt === currentBT &&
    item.team === team &&
    dayIso >= item.startDate &&
    dayIso <= item.endDate
  );
}

function toggleWaitingReasonField() {
  if (appointmentStatus.value === "wartegrund") {
    waitingReasonWrap.classList.remove("hidden");
  } else {
    waitingReasonWrap.classList.add("hidden");
    waitingReasonSelect.value = "";
  }
}

function appendWaitingReasonLog(order, waitingReason) {
  if (!waitingReason) return;

  const logLine =
    `[${formatDateTimeNow()}] Wartegrund gesetzt: ${waitingReason}`;

  order.details = order.details
    ? `${order.details}\n${logLine}`
    : logLine;
}

function appendMoveLog(order, oldDate, oldTeam, newDate, newTeam, source) {
  const method = source === "drag" ? "per Drag & Drop" : "über Auftrag verschieben";

  const logLine =
    `[${formatDateTimeNow()}] ${getCurrentUserLabel()} hat den Auftrag ${method} verschoben: ${oldTeam || "-"} / ${formatShortDateFromIso(oldDate)} → ${newTeam || "-"} / ${formatShortDateFromIso(newDate)}.`;

  order.details = order.details
    ? `${order.details}\n${logLine}`
    : logLine;
}

function hasVaoConflict(order, newDate) {
  return Boolean(
    order.vaoStart &&
    order.vaoEnd &&
    (newDate < order.vaoStart || newDate > order.vaoEnd)
  );
}

function getExportFieldLabel(key) {
  return EXPORT_FIELDS.find((field) => field.key === key)?.label || key;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getPlanningPoolOrders() {
  return orders
    .filter((order) => order.sourceStage === "planning_pool")
    .sort((a, b) => {
      if (a.bt !== b.bt) return a.bt.localeCompare(b.bt);
      return (a.address || "").localeCompare(b.address || "");
    });
}

function updatePlanningPoolCounter() {
  if (!poolPlanningCount) return;

  const count = getPlanningPoolOrders().length;
  poolPlanningCount.textContent = count;

  if (poolPlanningBtn) {
    poolPlanningBtn.classList.toggle("has-items", count > 0);
  }
}

function buildControlGeneratedText(order) {
  const productionReady = getRadioValue("controlPtiSketch");
  const blocks = [...document.querySelectorAll(".control-block-btn.active")]
    .map((btn) => btn.dataset.controlBlock);

  const size = getControlCategoryText(getRadioValue("controlCategory"));
  const location = getRadioValue("controlSmDoku");
  const surface = document.querySelector(".control-surface-btn.active")?.dataset.surface || "";

  const lines = [
    `Kontrolle abgeschlossen von ${getCurrentUserLabel()} am ${formatDateTimeNow()}.`,
    `Auftrag: ${order.address || "-"}`,
    `KLS-ID: ${order.klsId || "-"}`,
    ""
  ];

  if (productionReady === "nein") {
    if (blocks.length === 1) {
      lines.push(`Der Auftrag kann nicht bearbeitet werden, weil ${blocks[0]} fehlt.`);
    }

    if (blocks.length > 1) {
      lines.push(`Der Auftrag kann nicht bearbeitet werden, weil ${blocks.join(" und ")} fehlen.`);
    }

    if (!blocks.length) {
      lines.push("Der Auftrag kann aktuell nicht bearbeitet werden, weil Unterlagen fehlen.");
    }

    return lines.join("\n");
  }

  lines.push("Auftrag ist produktionsreif.");

  if (size) lines.push(`Größe: ${size}`);
  if (location) lines.push(`Lage: ${location}`);
  if (surface) lines.push(`Oberfläche: ${surface}`);

  return lines.join("\n");
}

function openControlCompleteModal(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;

  pendingControlCompleteOrderId = order.id;

  controlCompleteSubtitle.textContent = order.address || "Auftrag prüfen und kategorisieren";

  setRadioValue("controlPtiSketch", "ja");

  document.querySelectorAll(".control-block-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".control-surface-btn").forEach((btn) => btn.classList.remove("active"));

  setRadioValue("controlCategory", "");
  setRadioValue("controlSmDoku", "");

  document.getElementById("controlYesArea")?.classList.remove("hidden");
  document.getElementById("controlNoArea")?.classList.add("hidden");

  controlDokuFeedback.value = "";
  controlGeneratedText.value = buildControlGeneratedText(order);

  openModal(controlCompleteModal);
}

/***********************************************************
 * MOVE / PVS / DRAG & DROP
 ***********************************************************/

function prepareMoveFlow(orderId, newDate, newTeam, source = "button") {
  const order = orders.find((item) => item.id === orderId);

  if (!order) return;

  pendingMoveOrderId = order.id;
  pendingMoveSource = source;

  pendingMoveData = {
    newDate,
    newTeam,
    oldDate: order.date,
    oldTeam: order.team
  };

  const effortConflict = hasEffortOnTeam(
    newDate,
    newTeam,
    order.id
  );

  if (effortConflict) {
    const proceed = confirm(
      "Auf diesem Trupp liegt bereits ein Mehraufwand. Trotzdem verschieben?"
    );

    if (!proceed) {
      pendingMoveOrderId = null;
      pendingMoveData = null;
      draggedOrderId = null;
      return;
    }
  }

  if (hasVaoConflict(order, newDate)) {
    vaoMoveWarningText.textContent =
      `Die VAO ist aktuell bis ${formatShortDateFromIso(order.vaoEnd)} gültig. Trotzdem verschieben?`;

    closeModal(moveOrderModal);
    openModal(vaoMoveWarningModal);
    return;
  }

  continueMoveAfterVao();
}

function continueMoveAfterVao() {
  const order = orders.find(
    (item) => item.id === pendingMoveOrderId
  );

  if (!order) return;

  closeModal(vaoMoveWarningModal);

  if (order.pvsRequired === "ja") {
    openModal(pvsMoveChoiceModal);
    return;
  }

  applyMove("keep");
}

function applyMove(pvsMode) {
  const order = orders.find(
    (item) => item.id === pendingMoveOrderId
  );

  if (!order || !pendingMoveData) return;

  appendMoveLog(
    order,
    pendingMoveData.oldDate,
    pendingMoveData.oldTeam,
    pendingMoveData.newDate,
    pendingMoveData.newTeam,
    pendingMoveSource
  );

  order.date = pendingMoveData.newDate;
  order.team = pendingMoveData.newTeam;
  order.bt = currentBT;

  if (pvsMode === "delete") {
    order.pvsRequired = "nein";
    order.pvsSetupDate = "";
  }

  if (pvsMode === "new") {
    order.pvsRequired = "ja";
    order.pvsSetupDate = calculatePvsSetupDate(
      pendingMoveData.newDate
    );
  }

  closeModal(moveOrderModal);
  closeModal(vaoMoveWarningModal);
  closeModal(pvsMoveChoiceModal);

  pendingMoveOrderId = null;
  pendingMoveData = null;
  draggedOrderId = null;

  renderAll();
}

function addDropEvents(element, dayIso, team) {
  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("drag-over");
  });

  element.addEventListener("dragleave", () => {
    element.classList.remove("drag-over");
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();

    element.classList.remove("drag-over");

    if (!draggedOrderId) return;

    prepareMoveFlow(
      draggedOrderId,
      dayIso,
      team,
      "drag"
    );
  });
}

/***********************************************************
 * KONTROLLE POOL
 ***********************************************************/

function saveControlData(order) {
  const controlData = {
    ptiSketch: getRadioValue("controlPtiSketch"),
    smDoku: getRadioValue("controlSmDoku"),
    category: getRadioValue("controlCategory"),
    categoryText: getControlCategoryText(
      getRadioValue("controlCategory")
    ),
    dokuFeedback: safeText(
      controlDokuFeedback.value
    ),
    generatedText: safeText(
      controlGeneratedText.value
    ),
    completedBy: getCurrentUserLabel(),
    completedAt: formatDateTimeNow()
  };

  order.controlData = controlData;

  const historyLine =
    `[${controlData.completedAt}] ${controlData.completedBy} hat die Kontrolle abgeschlossen. Kategorie: ${controlData.categoryText}`;

  order.details = order.details
    ? `${order.details}\n${historyLine}\n${controlData.generatedText}`
    : `${historyLine}\n${controlData.generatedText}`;

  order.controlReservedBy = "";
  order.controlReservedAt = "";
  order.controlProcessing = false;

  order.sourceStage = "planning_pool";
}

/***********************************************************
 * KONTROLLE MODAL V2 LOGIK
 ***********************************************************/

function refreshControlModalText() {
  const order = orders.find((item) => item.id === pendingControlCompleteOrderId);
  if (!order) return;

  const productionReady = getRadioValue("controlPtiSketch");

  document.getElementById("controlYesArea")?.classList.toggle("hidden", productionReady !== "ja");
  document.getElementById("controlNoArea")?.classList.toggle("hidden", productionReady !== "nein");

  controlGeneratedText.value = buildControlGeneratedText(order);
}

document.querySelectorAll('input[name="controlPtiSketch"]').forEach((input) => {
  input.addEventListener("change", refreshControlModalText);
});

document.querySelectorAll('input[name="controlCategory"], input[name="controlSmDoku"]').forEach((input) => {
  input.addEventListener("change", refreshControlModalText);
});

document.querySelectorAll(".control-block-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    refreshControlModalText();
  });
});

document.querySelectorAll(".control-surface-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".control-surface-btn").forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    refreshControlModalText();
  });
});

/***********************************************************
 * PLANUNGSPOOL
 ***********************************************************/

function renderPlanningPool() {
  if (!planningPoolList) return;

  planningPoolList.innerHTML = "";

  const planningOrders = getPlanningPoolOrders();

  updatePlanningPoolCounter();

  if (!planningOrders.length) {
    planningPoolList.innerHTML = `
      <div class="planning-pool-empty">
        Keine Aufträge im Pool vorhanden.
      </div>
    `;
    return;
  }

  planningOrders.forEach((order) => {
    const card = document.createElement("div");

    card.className = "planning-pool-card";

    card.innerHTML = `
      <div class="planning-pool-card-left">

        <div class="planning-pool-address">
          ${order.address || "-"}
        </div>

        <div class="planning-pool-meta">

          <span class="planning-pool-chip">
            ${order.bt}
          </span>

          ${
            order.klsId
              ? `
              <span class="planning-pool-chip">
                ${order.klsId}
              </span>
            `
              : ""
          }

          ${
            order.controlData?.categoryText
              ? `
              <span class="planning-pool-chip planning-pool-category">
                ${order.controlData.categoryText}
              </span>
            `
              : ""
          }

          ${
            order.controlData?.completedBy
              ? `
              <span class="planning-pool-chip">
                ${order.controlData.completedBy}
              </span>
            `
              : ""
          }

        </div>

      </div>

      <div class="planning-pool-actions">

        <button
          class="planning-pool-action-btn"
          data-plan-id="${order.id}"
          title="Einplanen"
        >
          ✅
        </button>

      </div>
    `;

    planningPoolList.appendChild(card);
  });

  planningPoolList
    .querySelectorAll("[data-plan-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openPlanningPoolSchedule(
          button.dataset.planId
        );
      });
    });
}

function openPlanningPoolSchedule(orderId) {
  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) return;

  pendingPlanningPoolOrderId = order.id;

  planningPoolScheduleSubtitle.textContent =
    order.address || "Auftrag einplanen";

  planningPoolDateInput.value =
    getIsoDate(new Date());

  planningPoolTeamSelect.innerHTML = "";

  TEAMS.forEach((team) => {
    const option =
      document.createElement("option");

    option.value = team;
    option.textContent = team;

    planningPoolTeamSelect.appendChild(option);
  });

  renderPlanningPoolLoadPreview();

  openModal(
    planningPoolScheduleModal
  );
}

function renderPlanningPoolLoadPreview() {
  if (!planningPoolLoadPreview) return;

  planningPoolLoadPreview.innerHTML = "";

  const date = planningPoolDateInput.value;

  if (!date) return;

  TEAMS.forEach((team) => {
    const meters =
      getTeamMeters(date, team);

    const row =
      document.createElement("div");

    row.className =
      `move-load-row ${getMoveLoadClass(meters)}`;

    row.innerHTML = `
      <span>${team}</span>
      <span>${meters} m</span>
    `;

    row.addEventListener("click", () => {
      planningPoolTeamSelect.value =
        team;

      renderPlanningPoolLoadPreview();
    });

    planningPoolLoadPreview.appendChild(
      row
    );
  });
}

function confirmPlanningPoolSchedule() {
  const order = orders.find(
    (item) => item.id === pendingPlanningPoolOrderId
  );

  if (!order) return;

  const selectedDate = planningPoolDateInput.value;
  const selectedTeam = planningPoolTeamSelect.value;

  if (!selectedDate || !selectedTeam) {
    alert("Bitte Datum und Trupp auswählen.");
    return;
  }

  order.date = selectedDate;
  order.team = selectedTeam;
  order.bt = currentBT;

  order.sourceStage = "daily";
  order.vaoStatus = "nicht_gestellt";
  order.vaoReservedBy = "";
  order.vaoReservedAt = "";
  order.vaoProcessing = false;

  order.appointmentStatus = order.appointmentStatus || "nicht_bestaetigt";

  const logLine =
    `[${formatDateTimeNow()}] ${getCurrentUserLabel()} hat den Auftrag aus dem Pool in die Daily eingeplant: ${selectedTeam} / ${formatShortDateFromIso(selectedDate)}.`;

  order.details = order.details
    ? `${order.details}\n${logLine}`
    : logLine;

  pendingPlanningPoolOrderId = null;

  closeModal(planningPoolScheduleModal);
  closeModal(planningPoolModal);

  currentMainView = "week";
  currentDate = makeDate(selectedDate);
  dailyViewDate = selectedDate;

  renderAll();
}

/***********************************************************
 * MAIN RENDER
 ***********************************************************/

function renderAll() {
  renderHeader();
  renderBtDropdown();
  renderPdfBtSelect();
  renderMainViews();
  updatePlanningPoolCounter();

  if (currentMainView === "week") {
    renderWeek();
  }

  if (currentMainView === "vao") {
    renderVaoOpenList();
    renderVaoTodoList();
  }

  if (!liveDashboardModal.classList.contains("hidden")) {
    renderLiveDashboard();
  }

  if (!weekAdjustModal.classList.contains("hidden")) {
    renderWeekAdjustments();
  }

  if (!exportBuilderModal.classList.contains("hidden")) {
    renderExportBuilder();
  }

  if (!planningPoolModal.classList.contains("hidden")) {
    renderPlanningPool();
  }
}

function renderHeader() {
  weekDisplay.textContent =
    `${currentBT} · ${getWeekLabel()}`;

  if (currentMainView === "vao") {
    mainTitle.textContent =
      currentPoolView === "control"
        ? "Kontrolle Pool"
        : "VAO-Offenliste";

    mainSubtitle.textContent =
      currentPoolView === "control"
        ? "Aufträge aus der Schnittstelle zur Kontrolle"
        : "Offene VAO-Aufträge nach BT";

    vaoOpenListBtn.classList.add("active");
    backToWeekBtn.classList.add("hidden");

    return;
  }

  vaoOpenListBtn.classList.remove("active");

  if (dailyViewDate) {
    mainTitle.textContent =
      "Disposition Tagesansicht";

    mainSubtitle.textContent =
      `${currentBT} · ${getWeekLabel()}`;

    backToWeekBtn.classList.remove("hidden");
  } else {
    mainTitle.textContent =
      "Disposition Wochenübersicht";

    mainSubtitle.textContent =
      `${currentBT} · ${getWeekLabel()}`;

    backToWeekBtn.classList.add("hidden");
  }
}

function renderMainViews() {
  weekView.classList.toggle(
    "active-view",
    currentMainView === "week"
  );

  weekView.classList.toggle(
    "hidden",
    currentMainView !== "week"
  );

  vaoOpenMainView.classList.toggle(
    "active-view",
    currentMainView === "vao"
  );

  vaoOpenMainView.classList.toggle(
    "hidden",
    currentMainView !== "vao"
  );
}

/***********************************************************
 * WEEK / DAILY RENDER
 ***********************************************************/

function renderWeek() {
  weekGrid.innerHTML = "";

  const weekDays = getWeekDays();
  const todayIso = getIsoDate(new Date());

  if (dailyViewDate) {
    weekGrid.classList.add("daily-mode");
  } else {
    weekGrid.classList.remove("daily-mode");
  }

  weekDays.forEach((day) => {
    const column =
      document.createElement("section");

    column.className =
      "day-column";

    if (day.iso === todayIso) {
      column.classList.add("current-day");
    }

    if (dailyViewDate === day.iso) {
      column.classList.add("active-daily-column");
    }

    const isDailyMode =
      dailyViewDate === day.iso;

    column.innerHTML = `
      <div class="day-header">
        <div class="day-header-row">
          <div>
            <h3 class="day-title">
              ${day.name}
            </h3>

            <div class="day-date">
              ${formatDate(day.date)}
            </div>
          </div>

          <button
            class="day-view-btn ${isDailyMode ? "active" : ""}"
            type="button"
          >
            ${isDailyMode ? "📖" : "📘"}
          </button>
        </div>
      </div>

      <div class="day-body"></div>
    `;

    column
      .querySelector(".day-view-btn")
      .addEventListener("click", () => {
        dailyViewDate =
          dailyViewDate === day.iso
            ? null
            : day.iso;

        renderAll();
      });

    const body =
      column.querySelector(".day-body");

    if (isDailyMode) {
      renderDailyDayView(body, day.iso);
    } else {
      renderWeeklyDayView(body, day.iso);
    }

    weekGrid.appendChild(column);
  });
}

function renderWeeklyDayView(container, dayIso) {
  const availableTeams = [];
  const unavailableTeams = [];

  TEAMS.forEach((team) => {
    const adjustment =
      getAdjustment(dayIso, team);

    if (adjustment) {
      unavailableTeams.push(team);
    } else {
      availableTeams.push(team);
    }
  });

  [...availableTeams, ...unavailableTeams].forEach(
    (team) => {
      const adjustment =
        getAdjustment(dayIso, team);

      const ordersForTeam =
        getVisibleOrdersForDayAndTeam(
          dayIso,
          team
        );

      const totalMeters =
        getTeamMeters(dayIso, team);

      const teamBlock =
        document.createElement("div");

      teamBlock.className = "team-block";

      if (adjustment) {
        teamBlock.classList.add(
          "team-unavailable"
        );
      }

      teamBlock.innerHTML = `
        ${
          adjustment
            ? `
            <div class="team-unavailable-label">
              ${getAdjustmentText(adjustment.status)}

              <span class="team-unavailable-until">
                bis ${formatShortDateFromIso(adjustment.endDate)}
              </span>
            </div>
          `
            : ""
        }

        <div class="team-head">
          <div class="team-title">
            ${team} / Tagespensum
          </div>

          <div class="team-head-right">
            <div class="team-pensum">
              ${totalMeters} m
            </div>

            <button
              class="add-order-btn"
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div class="team-orders"></div>
      `;

      teamBlock
        .querySelector(".add-order-btn")
        .addEventListener("click", () => {
          createTarget = {
            team,
            date: dayIso
          };

          openCreateOrder();
        });

      const ordersWrap =
        teamBlock.querySelector(".team-orders");

      if (!ordersForTeam.length) {
        ordersWrap.innerHTML =
          `<div class="empty-box">Keine Aufträge</div>`;
      }

      ordersForTeam.forEach((order) => {
        ordersWrap.appendChild(
          createOrderCard(order)
        );
      });

      addDropEvents(teamBlock, dayIso, team);

      container.appendChild(teamBlock);
    }
  );
}

function renderDailyDayView(container, dayIso) {
  const layout =
    document.createElement("div");

  layout.className =
    "daily-horizontal-layout";

  const availableTeams = [];
  const unavailableTeams = [];

  TEAMS.forEach((team) => {
    const adjustment =
      getAdjustment(dayIso, team);

    if (adjustment) {
      unavailableTeams.push(team);
    } else {
      availableTeams.push(team);
    }
  });

  [...availableTeams, ...unavailableTeams].forEach(
    (team) => {
      const adjustment =
        getAdjustment(dayIso, team);

      const ordersForTeam =
        getVisibleOrdersForDayAndTeam(
          dayIso,
          team
        );

      const totalMeters =
        getTeamMeters(dayIso, team);

      const row =
        document.createElement("div");

      row.className =
        "daily-team-row";

      if (adjustment) {
        row.classList.add(
          "team-unavailable"
        );
      }

      row.innerHTML = `
        <div class="daily-team-header">
          <div class="daily-team-title">
            ${team}
          </div>

          ${
            adjustment
              ? `
              <div class="team-unavailable-label">
                ${getAdjustmentText(adjustment.status)}

                <span class="team-unavailable-until">
                  bis ${formatShortDateFromIso(adjustment.endDate)}
                </span>
              </div>
            `
              : ""
          }

          <div class="team-head-right">
            <div class="daily-team-meter">
              ${totalMeters} m
            </div>

            <button
              class="add-order-btn"
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div class="daily-orders-row"></div>
      `;

      row
        .querySelector(".add-order-btn")
        .addEventListener("click", () => {
          createTarget = {
            team,
            date: dayIso
          };

          openCreateOrder();
        });

      const rowOrders =
        row.querySelector(".daily-orders-row");

      if (!ordersForTeam.length) {
        rowOrders.innerHTML =
          `<div class="empty-box">Keine Aufträge</div>`;
      }

      ordersForTeam.forEach((order) => {
        rowOrders.appendChild(
          createOrderCard(order)
        );
      });

      addDropEvents(row, dayIso, team);

      layout.appendChild(row);
    }
  );

  container.appendChild(layout);
}

function createOrderCard(order) {
  const card = document.createElement("div");

  card.className =
    `order-card ${getOrderStatusClass(order)}`;

  card.draggable = true;

  card.addEventListener("dragstart", () => {
    draggedOrderId = order.id;
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  const vaoDate =
    order.vaoStart && order.vaoEnd
      ? `${formatShortDateFromIso(order.vaoStart)} - ${formatShortDateFromIso(order.vaoEnd)}`
      : "";

  card.innerHTML = `
    <div class="order-card-head compact-order-head">
      <div class="order-card-main">
        <div class="order-card-address">
          ${order.address || "Ohne Adresse"}
        </div>

        <div class="order-card-subline">
          ${order.klsId ? `<span>${order.klsId}</span>` : ""}
          ${order.meters ? `<span>${order.meters} m</span>` : `<span>0 m</span>`}
        </div>
      </div>
    </div>

    <div class="order-card-bubbles compact-bubbles">
      <span class="order-bubble bubble-vao vao-combo-bubble">
        <span>${getVaoText(order.vaoStatus)}</span>
        ${vaoDate ? `<small>${vaoDate}</small>` : ""}
      </span>

      ${
        order.appointmentStatus === "wartegrund" && order.waitingReason
          ? `<span class="order-bubble bubble-waiting">Wartegrund · ${order.waitingReason}</span>`
          : ""
      }

      ${
        order.completed
          ? `<span class="order-bubble bubble-completed">Fertiggestellt</span>`
          : ""
      }

      ${
        order.blownIn
          ? `<span class="order-bubble bubble-blown">Eingeblasen</span>`
          : ""
      }

      ${
        order.effortType
          ? `<span class="order-bubble bubble-effort">${getEffortText(order.effortType)}</span>`
          : ""
      }

      ${
        order.pvsRequired === "ja"
          ? `<span class="order-bubble bubble-pvs">PVS</span>`
          : ""
      }
    </div>
  `;

  card.addEventListener("click", () => {
    openEditOrder(order.id);
  });

  return card;
}

/***********************************************************
 * VAO OFFENLISTE / KONTROLLE POOL
 ***********************************************************/

function getPoolOrdersByBt() {
  const grouped = {};

  BTS.forEach((bt) => {
    if (currentPoolView === "control") {
      grouped[bt] = orders
        .filter((order) =>
          order.bt === bt &&
          order.sourceStage === "control_pool"
        )
        .sort((a, b) =>
          (a.address || "").localeCompare(b.address || "")
        );
    } else {
      grouped[bt] = orders
        .filter((order) =>
          order.bt === bt &&
          order.sourceStage !== "control_pool" &&
          order.sourceStage !== "planning_pool" &&
          (!order.vaoStatus || order.vaoStatus === "nicht_gestellt")
        )
        .sort((a, b) =>
          makeDate(a.date || getIsoDate(new Date())) -
          makeDate(b.date || getIsoDate(new Date()))
        );
    }
  });

  return grouped;
}

function renderVaoOpenList() {
  const grouped = getPoolOrdersByBt();

  poolViewTitle.textContent =
    currentPoolView === "control"
      ? "Kontrolle Pool"
      : "VAO-Offenliste";

  poolViewSubtitle.textContent =
    currentPoolView === "control"
      ? "Aufträge aus der Schnittstelle zur Kontrolle"
      : "Alle Aufträge mit „VAO nicht gestellt“";

  poolViewSwitchBtn.classList.toggle(
    "active",
    currentPoolView === "control"
  );

  vaoOpenListContainer.innerHTML = "";

  let totalOpen = 0;

  BTS.forEach((bt) => {
    const btOrders = grouped[bt];
    totalOpen += btOrders.length;

    const block =
      document.createElement("section");

    block.className =
      "vao-open-bt-block";

    block.innerHTML = `
      <div class="vao-open-bt-header">
        <div class="vao-open-bt-title">
          ${bt}
        </div>

        <div class="vao-open-bt-count">
          ${btOrders.length} offen
        </div>
      </div>

      <div class="vao-open-orders"></div>
    `;

    const orderWrap =
      block.querySelector(".vao-open-orders");

    if (!btOrders.length) {
      orderWrap.innerHTML = `
        <div class="vao-empty">
          ${
            currentPoolView === "control"
              ? "Keine Aufträge im Kontrolle Pool."
              : "Keine offenen VAOs."
          }
        </div>
      `;
    }

    btOrders.forEach((order) => {
      const isControl =
        currentPoolView === "control";

      const card =
        document.createElement("div");

      const reservedBy =
        isControl
          ? order.controlReservedBy
          : order.vaoReservedBy;

      const reservedAt =
        isControl
          ? order.controlReservedAt
          : order.vaoReservedAt;

      const processing =
        isControl
          ? order.controlProcessing
          : order.vaoProcessing;

      card.className = `vao-open-card ${
        isControl ? "control-pool-card" : ""
      } ${processing ? "processing" : ""} ${
        reservedBy ? "locked" : ""
      }`;

      const reservedText =
        reservedBy && reservedAt
          ? `Reserviert von ${reservedBy} · ${reservedAt}`
          : "";

      card.innerHTML = `
        <div class="vao-open-left">
          <div class="vao-open-address">
            ${order.address || "Ohne Adresse"}
          </div>

          <div class="vao-open-meta">
            <span class="vao-meta-chip">${order.bt}</span>

            ${
              order.team
                ? `<span class="vao-meta-chip">${order.team}</span>`
                : ""
            }

            ${
              order.date
                ? `<span class="vao-meta-chip">${formatShortDateFromIso(order.date)}</span>`
                : ""
            }

            ${
              order.klsId
                ? `<span class="vao-meta-chip">${order.klsId}</span>`
                : ""
            }

            ${
              isControl
                ? `<span class="vao-meta-chip pool-chip">Kontrolle</span>`
                : ""
            }

            ${
              reservedText
                ? `<span class="vao-meta-chip vao-reserved-chip">${reservedText}</span>`
                : ""
            }

            ${
              processing
                ? `<span class="vao-meta-chip vao-processing-chip">In Bearbeitung</span>`
                : ""
            }
          </div>
        </div>

        <div class="vao-open-actions">
          <button
            class="vao-action-btn locked-btn"
            type="button"
            title="Reservieren"
          >
            ${reservedBy ? "🔓" : "🔒"}
          </button>

          <button
            class="vao-action-btn ${processing ? "active-flag" : ""}"
            type="button"
            title="In Bearbeitung"
          >
            🚩
          </button>

          <button
            class="vao-action-btn done-btn"
            type="button"
            title="${isControl ? "Kontrolle abschließen" : "VAO gestellt"}"
          >
            ✅
          </button>
        </div>
      `;

      const [lockBtn, flagBtn, doneBtn] =
        card.querySelectorAll(".vao-action-btn");

      lockBtn.addEventListener("click", () => {
        if (isControl) {
          if (order.controlReservedBy) {
            if (!canUnlockControlReservation(order)) {
              alert("Nur die Person, die reserviert hat, kann die Reservierung wieder entfernen.");
              return;
            }

            order.controlReservedBy = "";
            order.controlReservedAt = "";

            renderAll();
            return;
          }

          order.controlReservedBy =
            getCurrentUserLabel();

          order.controlReservedAt =
            formatDateTimeNow();

          renderAll();
          return;
        }

        if (order.vaoReservedBy) {
          if (!canUnlockReservation(order)) {
            alert("Nur die Person, die reserviert hat, kann die Reservierung wieder entfernen.");
            return;
          }

          order.vaoReservedBy = "";
          order.vaoReservedAt = "";

          renderAll();
          return;
        }

        pendingVaoReserveOrderId =
          order.id;

        openModal(vaoReserveConfirmModal);
      });

      flagBtn.addEventListener("click", () => {
        if (isControl) {
          if (
            order.controlReservedBy &&
            !canUnlockControlReservation(order)
          ) {
            alert("Dieser Auftrag ist von einer anderen Person reserviert.");
            return;
          }

          order.controlProcessing =
            !order.controlProcessing;

          renderAll();
          return;
        }

        if (
          order.vaoReservedBy &&
          !canUnlockReservation(order)
        ) {
          alert("Dieser Auftrag ist von einer anderen Person reserviert.");
          return;
        }

        order.vaoProcessing =
          !order.vaoProcessing;

        renderAll();
      });

      doneBtn.addEventListener("click", () => {
        if (isControl) {
          if (
            order.controlReservedBy &&
            !canUnlockControlReservation(order)
          ) {
            alert("Dieser Auftrag ist von einer anderen Person reserviert.");
            return;
          }

          openControlCompleteModal(order.id);
          return;
        }

        if (
          order.vaoReservedBy &&
          !canUnlockReservation(order)
        ) {
          alert("Dieser Auftrag ist von einer anderen Person reserviert.");
          return;
        }

        pendingVaoCompleteOrderId =
          order.id;

        vaoCompleteStart.value =
          order.vaoStart || "";

        vaoCompleteEnd.value =
          order.vaoEnd || "";

        vaoCompleteMeters.value =
          order.meters || "";

        setRadioValue(
          "vaoCompletePvs",
          order.pvsRequired || "nein"
        );

        setRadioValue(
          "vaoCompletePermit",
          order.permit || "nein"
        );

        openModal(vaoCompleteModal);
      });

      orderWrap.appendChild(card);
    });

    vaoOpenListContainer.appendChild(block);
  });

  if (totalOpen === 0) {
    vaoOpenListContainer.innerHTML = `
      <div class="vao-empty">
        ${
          currentPoolView === "control"
            ? "Es gibt aktuell keine Aufträge im Kontrolle Pool."
            : "Es gibt aktuell keine offenen VAO-Aufträge."
        }
      </div>
    `;
  }
}

function renderVaoTodoList() {
  const isControl =
    currentPoolView === "control";

  poolTodoTitle.textContent =
    "To Do Liste";

  poolTodoSubtitle.textContent =
    isControl
      ? "Deine reservierten Kontroll-Aufträge"
      : "Deine reservierten VAO-Aufträge";

  const myOrders = orders
    .filter((order) =>
      isControl
        ? order.controlReservedBy === getCurrentUserLabel()
        : order.vaoReservedBy === getCurrentUserLabel()
    )
    .sort((a, b) => {
      if (a.bt !== b.bt) {
        return a.bt.localeCompare(b.bt);
      }

      return (a.address || "").localeCompare(
        b.address || ""
      );
    });

  vaoTodoListContainer.innerHTML = "";

  if (!myOrders.length) {
    vaoTodoListContainer.innerHTML = `
      <div class="vao-empty">
        ${
          isControl
            ? "Du hast aktuell keine Kontroll-Aufträge reserviert."
            : "Du hast aktuell keine VAO-Aufträge reserviert."
        }
      </div>
    `;
    return;
  }

  BTS.forEach((bt) => {
    const btOrders =
      myOrders.filter((order) => order.bt === bt);

    if (!btOrders.length) return;

    const group =
      document.createElement("div");

    group.className =
      "todo-bt-group";

    group.innerHTML =
      `<div class="todo-bt-title">${bt}</div>`;

    btOrders.forEach((order) => {
      const item =
        document.createElement("div");

      item.className =
        "todo-order-card";

      item.innerHTML = `
        <div class="todo-order-address">
          ${order.address || "Ohne Adresse"}
        </div>

        <div class="todo-order-meta">
          ${
            order.team
              ? `<span class="todo-order-chip">${order.team}</span>`
              : ""
          }

          ${
            order.date
              ? `<span class="todo-order-chip">${formatShortDateFromIso(order.date)}</span>`
              : ""
          }

          ${
            isControl
              ? `<span class="todo-order-chip">Kontrolle</span>`
              : ""
          }
        </div>
      `;

      group.appendChild(item);
    });

    vaoTodoListContainer.appendChild(group);
  });
}

/***********************************************************
 * LIVE DASHBOARD
 ***********************************************************/

function renderLiveDashboard() {
  const data = getOrdersForScope();

  const total = data.length;
  const confirmed = data.filter((item) => item.appointmentStatus === "bestaetigt").length;
  const open = data.filter((item) => !item.appointmentStatus || item.appointmentStatus === "nicht_bestaetigt").length;
  const completed = data.filter((item) => item.completed).length;
  const blownIn = data.filter((item) => item.completed && item.blownIn).length;
  const effortOrders = data.filter((item) => Boolean(item.effortType)).length;

  const percent = total ? Math.round((confirmed / total) * 100) : 0;

  liveTotalOrders.textContent = total;
  liveConfirmedOrders.textContent = confirmed;
  liveOpenOrders.textContent = open;
  liveCompletedOrders.textContent = completed;
  liveBlownInOrders.textContent = blownIn;
  liveEffortOrders.textContent = effortOrders;
  liveConfirmedPercent.textContent = `${percent}%`;
  liveConfirmedProgress.style.width = `${percent}%`;

  if (liveUnaToggle.checked) {
    activeBtCount.classList.remove("hidden");
    activeBtCount.textContent = `Aktive BTs: ${new Set(data.map((item) => item.bt)).size}`;
  } else {
    activeBtCount.classList.add("hidden");
  }

  liveDashboardTitle.textContent = liveUnaToggle.checked
    ? `Live Dashboard Una · ${currentBT} · ${getWeekLabel()}`
    : `Live Dashboard Solus · ${currentBT} · ${getWeekLabel()}`;

  renderLiveHints(data);
  renderDailyChart(data);
  renderVaoChart(data);
  renderTrendChart();
}

function renderLiveHints(data) {
  const missing = data.filter((item) => parseMeters(item.meters) === null).length;

  if (missing > 0) {
    missingMetersHint.classList.remove("hidden");
    missingMetersHint.textContent = `${missing} Aufträge ohne Meterangabe`;
  } else {
    missingMetersHint.classList.add("hidden");
  }

  if (!absenceToggle.checked) {
    absenceHint.classList.add("hidden");
    return;
  }

  const weekDates = getCurrentWeekDates();

  const count = teamAdjustments.filter((item) => {
    if (!liveUnaToggle.checked && item.bt !== currentBT) return false;
    return weekDates.some((day) => day >= item.startDate && day <= item.endDate);
  }).length;

  absenceHint.classList.remove("hidden");
  absenceHint.textContent = `Ausfälle: ${count}`;
}

function renderDailyChart(data) {
  liveDailyChart.innerHTML = "";

  const weekDays = getWeekDays();

  const maxOrders = Math.max(
    ...weekDays.map((day) => data.filter((item) => item.date === day.iso).length),
    1
  );

  weekDays.forEach((day) => {
    const dayOrders = data.filter((item) => item.date === day.iso);

    const total = dayOrders.length;
    const confirmed = dayOrders.filter((item) => item.appointmentStatus === "bestaetigt").length;
    const storno = dayOrders.filter((item) => item.appointmentStatus === "storno").length;
    const klaerung = dayOrders.filter((item) => item.appointmentStatus === "klaerung").length;
    const wartegrund = dayOrders.filter((item) => item.appointmentStatus === "wartegrund").length;
    const open = Math.max(total - confirmed - storno - klaerung - wartegrund, 0);

    const maxHeight = 230;
    const totalHeight = total ? Math.max((total / maxOrders) * maxHeight, 8) : 8;

    const column = document.createElement("div");
    column.className = "live-day-column";

    if (avgMetersToggle.checked) {
      const validMeters = dayOrders
        .map((item) => parseMeters(item.meters))
        .filter((item) => item !== null);

      const average = validMeters.length
        ? Math.round(validMeters.reduce((sum, value) => sum + value, 0) / validMeters.length)
        : 0;

      column.innerHTML = `
        <div class="live-bars-wrap">
          <div class="avg-meter-bar" style="height:${Math.max(average * 8, 8)}px">
            <span>Ø ${average} m</span>
          </div>
        </div>

        <div class="live-day-label">${day.short}</div>
      `;
    } else {
      const seg = (value) => total ? (value / total) * totalHeight : 0;

      column.innerHTML = `
        <div class="live-bars-wrap">
          <div class="live-total-bar" style="height:${totalHeight}px">
            <span>${total}</span>
          </div>

          <div class="live-status-stack" style="height:${totalHeight}px">
            <div class="stack-confirmed" style="height:${seg(confirmed)}px"></div>
            <div class="stack-storno" style="height:${seg(storno)}px"></div>
            <div class="stack-klaerung" style="height:${seg(klaerung)}px"></div>
            <div class="stack-waiting" style="height:${seg(wartegrund)}px"></div>
            <div class="stack-open" style="height:${seg(open)}px"></div>
          </div>
        </div>

        <div class="live-day-label">${day.short}</div>
      `;
    }

    liveDailyChart.appendChild(column);
  });
}

function renderVaoChart(data) {
  const stats = {
    da: data.filter((item) => item.vaoStatus === "da").length,
    gestellt: data.filter((item) => item.vaoStatus === "gestellt").length,
    nichtGestellt: data.filter((item) => !item.vaoStatus || item.vaoStatus === "nicht_gestellt").length,
    nichtNoetig: data.filter((item) => item.vaoStatus === "nicht_noetig").length
  };

  const total = Math.max(
    1,
    stats.da + stats.gestellt + stats.nichtGestellt + stats.nichtNoetig
  );

  let start = 0;

  const parts = [
    ["var(--vao-da)", stats.da],
    ["var(--vao-gestellt)", stats.gestellt],
    ["var(--vao-nichtgestellt)", stats.nichtGestellt],
    ["var(--vao-nichtnoetig)", stats.nichtNoetig]
  ].map(([color, value]) => {
    const end = start + (value / total) * 100;
    const part = `${color} ${start}% ${end}%`;
    start = end;
    return part;
  });

  vaoPieChart.style.background = `conic-gradient(${parts.join(", ")})`;

  vaoPieLabels.innerHTML = `
    <div class="vao-pie-label-row">
      <div class="vao-pie-label-left">
        <span class="legend-dot vao-da"></span>
        <span>Da</span>
      </div>
      <div class="vao-pie-label-value">${stats.da}</div>
    </div>

    <div class="vao-pie-label-row">
      <div class="vao-pie-label-left">
        <span class="legend-dot vao-gestellt"></span>
        <span>Gestellt</span>
      </div>
      <div class="vao-pie-label-value">${stats.gestellt}</div>
    </div>

    <div class="vao-pie-label-row">
      <div class="vao-pie-label-left">
        <span class="legend-dot vao-nicht-gestellt"></span>
        <span>Nicht gestellt</span>
      </div>
      <div class="vao-pie-label-value">${stats.nichtGestellt}</div>
    </div>

    <div class="vao-pie-label-row">
      <div class="vao-pie-label-left">
        <span class="legend-dot vao-nicht-noetig"></span>
        <span>Nicht nötig</span>
      </div>
      <div class="vao-pie-label-value">${stats.nichtNoetig}</div>
    </div>
  `;
}

function renderTrendChart() {
  completedTrendChart.innerHTML = "";

  const weeks = [];

  for (let index = 3; index >= 0; index--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - index * 7);
    weeks.push(date);
  }

  const weekData = weeks.map((date) => {
    const monday = getMonday(date);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);

    const weekOrders = orders.filter((order) => {
      const orderDate = makeDate(order.date);
      const isInWeek = orderDate >= monday && orderDate <= friday;

      if (!isInWeek) return false;
      if (order.sourceStage === "control_pool") return false;
      if (order.sourceStage === "planning_pool") return false;
      if (liveUnaToggle.checked) return true;

      return order.bt === currentBT;
    });

    const normal = weekOrders.filter((order) =>
      order.completed &&
      !order.blownIn &&
      !order.effortType
    ).length;

    const blownIn = weekOrders.filter((order) =>
      order.completed &&
      order.blownIn &&
      !order.effortType
    ).length;

    const effort = weekOrders.filter((order) =>
      Boolean(order.effortType)
    ).length;

    return {
      label: `KW ${getISOWeek(date)}`,
      normal,
      blownIn,
      effort,
      total: normal + blownIn + effort
    };
  });

  const max = Math.max(...weekData.map((item) => item.total), 1);

  weekData.forEach((item) => {
    const column = document.createElement("div");
    column.className = "trend-week-column";

    const normalHeight = Math.max((item.normal / max) * 220, item.normal ? 8 : 0);
    const blownHeight = Math.max((item.blownIn / max) * 220, item.blownIn ? 8 : 0);
    const effortHeight = Math.max((item.effort / max) * 220, item.effort ? 8 : 0);

    column.innerHTML = `
      <div class="trend-bars">
        <div class="trend-bar normal" style="height:${normalHeight}px">
          <span>${item.normal}</span>
        </div>

        <div class="trend-bar blown" style="height:${blownHeight}px">
          <span>${item.blownIn}</span>
        </div>

        <div class="trend-bar effort" style="height:${effortHeight}px">
          <span>${item.effort}</span>
        </div>
      </div>

      <div class="trend-label">${item.label}</div>
    `;

    completedTrendChart.appendChild(column);
  });
}

/***********************************************************
 * EXPORT BUILDER
 ***********************************************************/

function getExportOrders() {
  const weekDates = getCurrentWeekDates();
  const scope = getRadioValue("exportScope");

  return orders
    .filter((order) => {
      if (!weekDates.includes(order.date)) return false;
      if (order.sourceStage === "control_pool") return false;
      if (order.sourceStage === "planning_pool") return false;
      if (scope === "una") return true;
      return order.bt === currentBT;
    })
    .sort((a, b) => {
      if (a.bt !== b.bt) return a.bt.localeCompare(b.bt);
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.team.localeCompare(b.team);
    });
}

function getExportFileName() {
  const kw = getISOWeek(currentDate);
  const year = currentDate.getFullYear();
  const scope = getRadioValue("exportScope");

  if (scope === "una") {
    return `Export_UNA_KW${kw}_${year}.xls`;
  }

  return `Export_${currentBT}_KW${kw}_${year}.xls`;
}

function renderExportBuilder() {
  exportWeekLabel.textContent = getWeekLabel();
  renderExportFieldBlocks();
  normalizeExportColumns();
  renderExportColumns();
  renderExportPreview();
}

function renderExportFieldBlocks() {
  exportFieldBlocks.innerHTML = "";

  EXPORT_FIELDS.forEach((field) => {
    const block = document.createElement("button");
    block.type = "button";
    block.className = "export-field-block";
    block.draggable = true;
    block.textContent = field.label;
    block.dataset.fieldKey = field.key;

    block.addEventListener("click", () => {
      addExportFieldToNextColumn(field.key);
    });

    block.addEventListener("dragstart", () => {
      draggedExportFieldKey = field.key;
    });

    block.addEventListener("dragend", () => {
      draggedExportFieldKey = null;
    });

    exportFieldBlocks.appendChild(block);
  });
}

function normalizeExportColumns() {
  exportColumnsState = exportColumnsState.filter(Boolean);

  if (exportColumnsState.length === 0) {
    exportColumnsState.push(null);
    return;
  }

  const last = exportColumnsState[exportColumnsState.length - 1];

  if (last !== null) {
    exportColumnsState.push(null);
  }
}

function addExportFieldToNextColumn(fieldKey) {
  const existingIndex = exportColumnsState.indexOf(fieldKey);

  if (existingIndex !== -1) {
    exportColumnsState.splice(existingIndex, 1);
  }

  const emptyIndex = exportColumnsState.findIndex((item) => item === null);

  if (emptyIndex === -1) {
    exportColumnsState.push(fieldKey);
  } else {
    exportColumnsState[emptyIndex] = fieldKey;
  }

  normalizeExportColumns();
  renderExportColumns();
  renderExportPreview();
}

function setExportFieldAtColumn(index, fieldKey) {
  const existingIndex = exportColumnsState.indexOf(fieldKey);

  if (existingIndex !== -1) {
    exportColumnsState[existingIndex] = null;
  }

  exportColumnsState[index] = fieldKey;

  normalizeExportColumns();
  renderExportColumns();
  renderExportPreview();
}

function removeExportColumn(index) {
  exportColumnsState[index] = null;
  normalizeExportColumns();
  renderExportColumns();
  renderExportPreview();
}

function renderExportColumns() {
  exportColumns.innerHTML = "";

  normalizeExportColumns();

  exportColumnsState.forEach((fieldKey, index) => {
    const slot = document.createElement("div");

    slot.className = "export-column-slot";
    slot.dataset.columnIndex = index;

    slot.innerHTML = `
      <div class="export-column-label">
        Spalte ${String.fromCharCode(65 + index)}
      </div>

      ${
        fieldKey
          ? `
          <div class="export-column-filled">
            <span>${getExportFieldLabel(fieldKey)}</span>

            <button
              class="export-remove-column"
              type="button"
            >
              ×
            </button>
          </div>
        `
          : `
          <div class="export-column-empty">
            Baustein hier ablegen
          </div>
        `
      }
    `;

    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();

      slot.classList.remove("drag-over");

      if (!draggedExportFieldKey) return;

      setExportFieldAtColumn(
        index,
        draggedExportFieldKey
      );
    });

    const removeBtn =
      slot.querySelector(".export-remove-column");

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        removeExportColumn(index);
      });
    }

    exportColumns.appendChild(slot);
  });
}

function getExportCellValue(order, key) {
  return order[key] ?? "";
}

function renderExportPreview() {
  const activeColumns =
    exportColumnsState.filter(Boolean);

  const data =
    getExportOrders().slice(0, 5);

  if (!activeColumns.length) {
    exportPreview.innerHTML = `
      <div class="export-preview-empty">
        Noch keine Spalten ausgewählt.
      </div>
    `;
    return;
  }

  if (!data.length) {
    exportPreview.innerHTML = `
      <div class="export-preview-empty">
        Keine Aufträge vorhanden.
      </div>
    `;
    return;
  }

  const head =
    activeColumns
      .map(
        (key) =>
          `<th>${escapeHtml(
            getExportFieldLabel(key)
          )}</th>`
      )
      .join("");

  const rows =
    data
      .map((order) => {
        const cells =
          activeColumns
            .map(
              (key) =>
                `<td>${escapeHtml(
                  getExportCellValue(
                    order,
                    key
                  )
                )}</td>`
            )
            .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

  exportPreview.innerHTML = `
    <table>
      <thead>
        <tr>${head}</tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function downloadExportFile() {
  const activeColumns =
    exportColumnsState.filter(Boolean);

  const data = getExportOrders();

  if (!activeColumns.length) {
    alert(
      "Bitte mindestens eine Spalte auswählen."
    );
    return;
  }

  if (!data.length) {
    alert(
      "Keine Aufträge in dieser KW vorhanden."
    );
    return;
  }

  const header =
    activeColumns
      .map(
        (key) =>
          `<th>${escapeHtml(
            getExportFieldLabel(key)
          )}</th>`
      )
      .join("");

  const rows =
    data
      .map((order) => {
        const cells =
          activeColumns
            .map(
              (key) =>
                `<td>${escapeHtml(
                  getExportCellValue(
                    order,
                    key
                  )
                )}</td>`
            )
            .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
      </head>

      <body>
        <table border="1">
          <thead>
            <tr>${header}</tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(
    [html],
    {
      type: "application/vnd.ms-excel;charset=utf-8;"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    getExportFileName();

  link.click();

  URL.revokeObjectURL(url);
}

/***********************************************************
 * ORDER FORM
 ***********************************************************/

function resetOrderForm() {
  orderForm.reset();

  editingOrderId = null;

  tempAppointment = {
    start: "",
    end: "",
    status: "nicht_bestaetigt",
    waitingReason: ""
  };

  orderVaoStatus.value =
    "nicht_gestellt";

  orderCompleted.checked = false;

  setRadioValue(
    "pvsRequired",
    "nein"
  );

  setRadioValue(
    "permit",
    "nein"
  );

  setRadioValue(
    "baz",
    "nein"
  );

  setRadioValue(
    "faz",
    "nein"
  );

  deleteOrderBtn.classList.add(
    "hidden"
  );
}

function openCreateOrder() {
  resetOrderForm();
  openModal(orderModal);
}

function openEditOrder(orderId) {
  const order =
    orders.find(
      (item) => item.id === orderId
    );

  if (!order) return;

  resetOrderForm();

  editingOrderId = orderId;

  deleteOrderBtn.classList.remove(
    "hidden"
  );

  orderAddress.value =
    order.address || "";

  orderKlsId.value =
    order.klsId || "";

  orderSmNumber.value =
    order.smNumber || "";

  orderAspName.value =
    order.aspName || "";

  orderAspPhone.value =
    order.aspPhone || "";

  orderEmail.value =
    order.email || "";

  orderExpansionStatus.value =
    order.expansionStatus || "";

  orderBuildingType.value =
    order.buildingType || "";

  orderMeters.value =
    order.meters || "";

  orderNvtArea.value =
    order.nvtArea || "";

  orderVaoStatus.value =
    order.vaoStatus || "nicht_gestellt";

  orderVaoStart.value =
    order.vaoStart || "";

  orderVaoEnd.value =
    order.vaoEnd || "";

  orderDetails.value =
    order.details || "";

  orderCompleted.checked =
    Boolean(order.completed);

  setRadioValue(
    "pvsRequired",
    order.pvsRequired || "nein"
  );

  setRadioValue(
    "permit",
    order.permit || "nein"
  );

  setRadioValue(
    "baz",
    order.baz || "nein"
  );

  setRadioValue(
    "faz",
    order.faz || "nein"
  );

  tempAppointment = {
    start:
      order.appointmentStart || "",
    end:
      order.appointmentEnd || "",
    status:
      order.appointmentStatus ||
      "nicht_bestaetigt",
    waitingReason:
      order.waitingReason || ""
  };

  openModal(orderModal);
}

function collectOrderPayload() {
  return {
    address: safeText(
      orderAddress.value
    ),

    klsId: safeText(
      orderKlsId.value
    ),

    smNumber: safeText(
      orderSmNumber.value
    ),

    aspName: safeText(
      orderAspName.value
    ),

    aspPhone: safeText(
      orderAspPhone.value
    ),

    email: safeText(
      orderEmail.value
    ),

    expansionStatus: safeText(
      orderExpansionStatus.value
    ),

    buildingType: safeText(
      orderBuildingType.value
    ),

    meters: safeText(
      orderMeters.value
    ),

    nvtArea: safeText(
      orderNvtArea.value
    ),

    vaoStatus:
      orderVaoStatus.value ||
      "nicht_gestellt",

    vaoStart:
      orderVaoStart.value,

    vaoEnd:
      orderVaoEnd.value,

    pvsRequired:
      getRadioValue(
        "pvsRequired"
      ),

    permit:
      getRadioValue(
        "permit"
      ),

    baz:
      getRadioValue(
        "baz"
      ),

    faz:
      getRadioValue(
        "faz"
      ),

    details:
      orderDetails.value,

    appointmentStart:
      tempAppointment.start,

    appointmentEnd:
      tempAppointment.end,

    appointmentStatus:
      tempAppointment.status,

    waitingReason:
      tempAppointment.waitingReason || ""
  };
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = collectOrderPayload();

  if (editingOrderId) {
    const order = orders.find(
      (item) => item.id === editingOrderId
    );

    if (!order) return;

    Object.assign(order, payload);

    order.pvsSetupDate =
      order.pvsRequired === "ja"
        ? calculatePvsSetupDate(order.date)
        : "";
  } else {
    if (!createTarget) {
      alert("Kein Ziel für den neuen Auftrag gefunden.");
      return;
    }

    const pvsSetupDate =
      payload.pvsRequired === "ja"
        ? calculatePvsSetupDate(createTarget.date)
        : "";

    orders.push({
      id: crypto.randomUUID(),
      bt: currentBT,
      team: createTarget.team,
      date: createTarget.date,
      ...payload,
      pvsSetupDate,
      completed: false,
      blownIn: false,
      effortType: "",
      vaoReservedBy: "",
      vaoReservedAt: "",
      vaoProcessing: false,
      sourceStage: "daily",
      controlProcessing: false,
      controlReservedBy: "",
      controlReservedAt: "",
      controlData: null
    });
  }

  closeModal(orderModal);

  renderAll();
});

/***********************************************************
 * COMPLETED / EFFORT / DELETE
 ***********************************************************/

orderCompleted.addEventListener("change", () => {
  if (!editingOrderId) {
    orderCompleted.checked = false;

    alert(
      "Bitte Auftrag erst speichern, danach Fertiggestellt setzen."
    );

    return;
  }

  const order =
    orders.find(
      (item) => item.id === editingOrderId
    );

  if (!order) return;

  if (!orderCompleted.checked) {
    order.completed = false;
    order.blownIn = false;

    renderAll();
    return;
  }

  pendingCompletedOrderId =
    editingOrderId;

  openModal(completedQuestionModal);
});

completedNoBtn.addEventListener("click", () => {
  const order =
    orders.find(
      (item) =>
        item.id === pendingCompletedOrderId
    );

  if (!order) return;

  order.completed = true;
  order.blownIn = false;

  orderCompleted.checked = true;

  closeModal(completedQuestionModal);

  renderAll();
});

completedYesBtn.addEventListener("click", () => {
  const order =
    orders.find(
      (item) =>
        item.id === pendingCompletedOrderId
    );

  if (!order) return;

  order.completed = true;
  order.blownIn = true;

  orderCompleted.checked = true;

  closeModal(completedQuestionModal);

  renderAll();
});

openEffortBtn.addEventListener("click", () => {
  if (!editingOrderId) {
    alert(
      "Bitte Auftrag erst speichern, danach Aufwandskontrolle setzen."
    );

    return;
  }

  pendingEffortOrderId =
    editingOrderId;

  const order =
    orders.find(
      (item) =>
        item.id === editingOrderId
    );

  if (order?.effortType) {
    setRadioValue(
      "effortType",
      order.effortType
    );
  } else {
    setRadioValue(
      "effortType",
      "asphalt"
    );
  }

  openModal(effortModal);
});

saveEffortBtn.addEventListener("click", () => {
  const order =
    orders.find(
      (item) =>
        item.id === pendingEffortOrderId
    );

  if (!order) return;

  order.effortType =
    getRadioValue("effortType");

  closeModal(effortModal);

  renderAll();
});

clearEffortBtn.addEventListener("click", () => {
  const order =
    orders.find(
      (item) =>
        item.id === pendingEffortOrderId
    );

  if (!order) return;

  order.effortType = "";

  closeModal(effortModal);

  renderAll();
});

deleteOrderBtn.addEventListener("click", () => {
  if (!editingOrderId) return;

  openModal(deleteOrderConfirmModal);
});

confirmDeleteOrderBtn.addEventListener("click", () => {
  orders = orders.filter(
    (item) => item.id !== editingOrderId
  );

  closeModal(deleteOrderConfirmModal);
  closeModal(orderModal);

  renderAll();
});

/***********************************************************
 * TIME / WAITING REASON / DETAILS
 ***********************************************************/

openTimeModalBtn.addEventListener("click", () => {
  appointmentStart.value =
    tempAppointment.start || "";

  appointmentEnd.value =
    tempAppointment.end || "";

  appointmentStatus.value =
    tempAppointment.status ||
    "nicht_bestaetigt";

  waitingReasonSelect.value =
    tempAppointment.waitingReason || "";

  toggleWaitingReasonField();

  openModal(timeModal);
});

saveTimeBtn.addEventListener("click", () => {
  const previousWaitingReason =
    tempAppointment.waitingReason || "";

  tempAppointment = {
    start:
      appointmentStart.value,
    end:
      appointmentEnd.value,
    status:
      appointmentStatus.value,
    waitingReason:
      appointmentStatus.value ===
      "wartegrund"
        ? waitingReasonSelect.value
        : ""
  };

  if (
    editingOrderId &&
    tempAppointment.status === "wartegrund" &&
    tempAppointment.waitingReason &&
    tempAppointment.waitingReason !== previousWaitingReason
  ) {
    const order =
      orders.find(
        (item) =>
          item.id === editingOrderId
      );

    if (order) {
      appendWaitingReasonLog(
        order,
        tempAppointment.waitingReason
      );

      orderDetails.value =
        order.details || "";
    }
  }

  closeModal(timeModal);
});

appointmentStatus.addEventListener(
  "change",
  toggleWaitingReasonField
);

insertSeparatorBtn.addEventListener("click", () => {
  const line =
    "------------------------------------------------------------";

  if (!orderDetails.value.trim()) {
    orderDetails.value =
      `${line}\n`;
  } else {
    orderDetails.value +=
      `\n${line}\n`;
  }

  orderDetails.focus();
});

/***********************************************************
 * MAP LINKS
 ***********************************************************/

function openMapLink(type) {
  const address =
    safeText(orderAddress.value);

  if (!address) return;

  const encoded =
    encodeURIComponent(address);

  if (type === "earth") {
    window.open(
      `https://earth.google.com/web/search/${encoded}`,
      "_blank"
    );
  }

  if (type === "apple") {
    window.open(
      `https://maps.apple.com/?q=${encoded}`,
      "_blank"
    );
  }

  if (type === "google") {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      "_blank"
    );
  }
}

openGoogleEarthBtn.addEventListener(
  "click",
  () => openMapLink("earth")
);

openAppleMapsBtn.addEventListener(
  "click",
  () => openMapLink("apple")
);

openGoogleMapsBtn.addEventListener(
  "click",
  () => openMapLink("google")
);


/***********************************************************
 * BT / WOCHE
 ***********************************************************/



/***********************************************************
 * WOCHENANPASSUNG
 ***********************************************************/

function renderWeekAdjustments() {
  weekAdjustTeamList.innerHTML = "";
  existingAdjustmentsList.innerHTML = "";

  TEAMS.forEach((team) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-adjust-team-btn";

    button.innerHTML = `
      <span>${team}</span>
      <span>Auswählen</span>
    `;

    button.addEventListener("click", () => {
      selectedAdjustTeam = team;
      teamAdjustTitle.textContent = `${currentBT} · ${team}`;
      teamAdjustStart.value = getCurrentWeekDates()[0];
      teamAdjustEnd.value = getCurrentWeekDates()[4];
      setRadioValue("teamAdjustStatus", "krank");
      openModal(teamAdjustModal);
    });

    weekAdjustTeamList.appendChild(button);
  });

  const list = teamAdjustments.filter((item) => item.bt === currentBT);

  if (!list.length) {
    existingAdjustmentsList.innerHTML = `
      <div class="empty-box">Keine Anpassungen vorhanden.</div>
    `;
    return;
  }

  list.forEach((adjustment) => {
    const row = document.createElement("div");
    row.className = "adjustment-card";

    row.innerHTML = `
      <div class="adjustment-info">
        <div class="adjustment-title">
          ${adjustment.team} · ${getAdjustmentText(adjustment.status)}
        </div>

        <div class="adjustment-time">
          ${formatShortDateFromIso(adjustment.startDate)} - ${formatShortDateFromIso(adjustment.endDate)}
        </div>
      </div>

      <button type="button" class="adjustment-remove-btn">🗑</button>
    `;

    row.querySelector(".adjustment-remove-btn").addEventListener("click", () => {
      teamAdjustments = teamAdjustments.filter((item) => item.id !== adjustment.id);
      renderAll();
    });

    existingAdjustmentsList.appendChild(row);
  });
}

weekAdjustBtn.addEventListener("click", () => {
  renderWeekAdjustments();
  openModal(weekAdjustModal);
});

saveTeamAdjustBtn.addEventListener("click", () => {
  if (!selectedAdjustTeam) {
    alert("Bitte einen Trupp auswählen.");
    return;
  }

  if (!teamAdjustStart.value || !teamAdjustEnd.value) {
    alert("Bitte Start- und Enddatum auswählen.");
    return;
  }

  if (teamAdjustEnd.value < teamAdjustStart.value) {
    alert("Das Enddatum darf nicht vor dem Startdatum liegen.");
    return;
  }

  teamAdjustments.push({
    id: crypto.randomUUID(),
    bt: currentBT,
    team: selectedAdjustTeam,
    status: getRadioValue("teamAdjustStatus"),
    startDate: teamAdjustStart.value,
    endDate: teamAdjustEnd.value
  });

  closeModal(teamAdjustModal);
  renderAll();
});

/***********************************************************
 * MOVE ORDER
 ***********************************************************/

function renderMoveLoadPreview() {
  const selectedDate = moveDateInput.value;

  moveLoadPreview.innerHTML = "";

  if (!selectedDate) return;

  TEAMS.forEach((team) => {
    const meters = getTeamMeters(selectedDate, team, pendingMoveOrderId);
    const hasEffort = hasEffortOnTeam(selectedDate, team, pendingMoveOrderId);

    const row = document.createElement("div");
    row.className = `move-load-row ${getMoveLoadClass(meters)} ${hasEffort ? "move-load-effort" : ""}`;

    if (moveTeamSelect.value === team) {
      row.classList.add("move-load-selected");
    }

    row.innerHTML = `
      <span>${team}${hasEffort ? " 🔒" : ""}</span>
      <span>${meters} m</span>
    `;

    row.addEventListener("click", () => {
      moveTeamSelect.value = team;
      renderMoveLoadPreview();
    });

    moveLoadPreview.appendChild(row);
  });
}

openMoveOrderBtn.addEventListener("click", () => {
  if (!editingOrderId) {
    alert("Auftrag erst speichern, dann verschieben.");
    return;
  }

  const order = orders.find((item) => item.id === editingOrderId);
  if (!order) return;

  pendingMoveOrderId = editingOrderId;
  pendingMoveSource = "button";

  moveDateInput.value = order.date || getIsoDate(new Date());
  moveTeamSelect.innerHTML = "";

  TEAMS.forEach((team) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    moveTeamSelect.appendChild(option);
  });

  moveTeamSelect.value = order.team || TEAMS[0];

  renderMoveLoadPreview();
  openModal(moveOrderModal);
});

moveDateInput.addEventListener("change", renderMoveLoadPreview);
moveTeamSelect.addEventListener("change", renderMoveLoadPreview);

confirmMoveOrderBtn.addEventListener("click", () => {
  const order = orders.find((item) => item.id === pendingMoveOrderId);
  if (!order) return;

  const newDate = moveDateInput.value;
  const newTeam = moveTeamSelect.value;

  if (!newDate || !newTeam) {
    alert("Bitte Datum und Trupp auswählen.");
    return;
  }

  prepareMoveFlow(order.id, newDate, newTeam, "button");
});

confirmVaoMoveBtn.addEventListener("click", continueMoveAfterVao);
pvsKeepBtn.addEventListener("click", () => applyMove("keep"));
pvsDeleteBtn.addEventListener("click", () => applyMove("delete"));
pvsNewBtn.addEventListener("click", () => applyMove("new"));

/***********************************************************
 * VAO
 ***********************************************************/

confirmVaoReserveBtn.addEventListener("click", () => {
  const order = orders.find((item) => item.id === pendingVaoReserveOrderId);
  if (!order) return;

  order.vaoReservedBy = getCurrentUserLabel();
  order.vaoReservedAt = formatDateTimeNow();

  closeModal(vaoReserveConfirmModal);
  pendingVaoReserveOrderId = null;

  renderAll();
});

saveVaoCompleteBtn.addEventListener("click", () => {
  const order = orders.find((item) => item.id === pendingVaoCompleteOrderId);
  if (!order) return;

  order.vaoStatus = "gestellt";

  if (vaoCompleteStart.value) order.vaoStart = vaoCompleteStart.value;
  if (vaoCompleteEnd.value) order.vaoEnd = vaoCompleteEnd.value;
  if (vaoCompleteMeters.value) order.meters = vaoCompleteMeters.value;

  order.permit = getRadioValue("vaoCompletePermit");
  order.pvsRequired = getRadioValue("vaoCompletePvs");

  order.pvsSetupDate =
    order.pvsRequired === "ja"
      ? calculatePvsSetupDate(order.date)
      : "";

  order.vaoReservedBy = "";
  order.vaoReservedAt = "";
  order.vaoProcessing = false;

  const logLine =
    `[${formatDateTimeNow()}] ${getCurrentUserLabel()} hat die VAO auf gestellt gesetzt.`;

  order.details = order.details
    ? `${order.details}\n${logLine}`
    : logLine;

  closeModal(vaoCompleteModal);
  pendingVaoCompleteOrderId = null;

  renderAll();
});

/***********************************************************
 * KONTROLLE ABSCHLIESSEN
 ***********************************************************/

saveControlCompleteBtn.addEventListener("click", () => {
  const order = orders.find((item) => item.id === pendingControlCompleteOrderId);
  if (!order) return;

  saveControlData(order);

  pendingControlCompleteOrderId = null;

  closeModal(controlCompleteModal);
  renderAll();
});

controlDokuFeedback.addEventListener("input", () => {
  const order = orders.find((item) => item.id === pendingControlCompleteOrderId);
  if (!order) return;

  controlGeneratedText.value = buildControlGeneratedText(order);
});

document
  .querySelectorAll('input[name="controlPtiSketch"], input[name="controlSmDoku"], input[name="controlCategory"]')
  .forEach((input) => {
    input.addEventListener("change", () => {
      const order = orders.find((item) => item.id === pendingControlCompleteOrderId);
      if (!order) return;

      controlGeneratedText.value = buildControlGeneratedText(order);
    });
  });

/***********************************************************
 * PLANUNGSPOOL
 ***********************************************************/

poolPlanningBtn?.addEventListener("click", () => {
  renderPlanningPool();
  openModal(planningPoolModal);
});

planningPoolDateInput?.addEventListener("change", renderPlanningPoolLoadPreview);
planningPoolTeamSelect?.addEventListener("change", renderPlanningPoolLoadPreview);
confirmPlanningPoolScheduleBtn?.addEventListener("click", confirmPlanningPoolSchedule);

/***********************************************************
 * EXPORT
 ***********************************************************/

clearExportColumnsBtn?.addEventListener("click", () => {
  exportColumnsState = [];
  renderExportBuilder();
});

downloadExportBtn?.addEventListener("click", downloadExportFile);

exportBuilderBtn?.addEventListener("click", () => {
  renderExportBuilder();
  openModal(exportBuilderModal);
});

document.querySelectorAll('input[name="exportScope"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    renderExportPreview();
  });
});

/***********************************************************
 * LIVE DASHBOARD
 ***********************************************************/

liveDashboardBtn?.addEventListener("click", () => {
  renderLiveDashboard();
  openModal(liveDashboardModal);
});

avgMetersToggle?.addEventListener("change", renderLiveDashboard);
absenceToggle?.addEventListener("change", renderLiveDashboard);
liveUnaToggle?.addEventListener("change", renderLiveDashboard);

/***********************************************************
 * SEARCH
 ***********************************************************/

searchInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const query = lower(searchInput.value);
  if (!query) return;

  const results = orders.filter((order) =>
    lower(order.address).includes(query) ||
    lower(order.klsId).includes(query) ||
    lower(order.smNumber).includes(query) ||
    lower(order.aspName).includes(query) ||
    lower(order.email).includes(query) ||
    lower(order.nvtArea).includes(query) ||
    lower(order.waitingReason).includes(query)
  );

  searchResultsContainer.innerHTML = "";

  if (!results.length) {
    searchResultsContainer.innerHTML = `
      <div class="warning-text">
        Zu deiner Suchanfrage konnte ich leider nichts finden.
      </div>
    `;
  } else {
    results
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return makeDate(b.date) - makeDate(a.date);
      })
      .forEach((order) => {
        const item = document.createElement("div");
        item.className = "search-result-card";

        item.innerHTML = `
          <div class="search-result-title">${order.address || "-"}</div>

          <div class="search-result-meta">
            <div>KLS-ID: ${order.klsId || "-"}</div>
            <div>Trupp: ${order.team || "-"}</div>
            <div>Datum: ${order.date ? formatDate(makeDate(order.date)) : "-"}</div>
            <div>${order.date ? `KW ${getISOWeek(makeDate(order.date))} / ${makeDate(order.date).getFullYear()}` : "Ohne Datum"}</div>
          </div>
        `;

        item.addEventListener("click", () => {
          if (order.sourceStage === "control_pool") {
            currentMainView = "vao";
            currentPoolView = "control";
            closeModal(searchResultsModal);
            renderAll();
            return;
          }

          if (order.sourceStage === "planning_pool") {
            closeModal(searchResultsModal);
            renderPlanningPool();
            openModal(planningPoolModal);
            return;
          }

          currentBT = order.bt;
          currentDate = order.date ? makeDate(order.date) : new Date();
          dailyViewDate = order.date || null;
          currentMainView = "week";

          closeModal(searchResultsModal);
          renderAll();

          setTimeout(() => openEditOrder(order.id), 100);
        });

        searchResultsContainer.appendChild(item);
      });
  }

  openModal(searchResultsModal);
});

searchInfoBtn?.addEventListener("click", () => openModal(searchInfoModal));

/***********************************************************
 * PDF
 ***********************************************************/

function renderPdfBtSelect() {
  if (!pdfBtSelect) return;

  pdfBtSelect.innerHTML = "";

  BTS.forEach((bt) => {
    const option = document.createElement("option");
    option.value = bt;
    option.textContent = bt;
    pdfBtSelect.appendChild(option);
  });

  pdfBtSelect.value = currentBT;
}

pdfExportBtn?.addEventListener("click", () => {
  renderPdfBtSelect();
  pdfBtSelect.value = currentBT;
  pdfDateInput.value = getIsoDate(new Date());
  openModal(pdfModal);
});

createPdfBtn?.addEventListener("click", () => {
  const selectedBT = pdfBtSelect.value;
  const selectedDate = pdfDateInput.value;

  const dayOrders = orders.filter((order) =>
    order.bt === selectedBT &&
    order.date === selectedDate &&
    order.sourceStage !== "control_pool" &&
    order.sourceStage !== "planning_pool"
  );

  if (!dayOrders.length) {
    alert("Für diesen Tag gibt es keine Aufträge.");
    return;
  }

  window.print();
});

/***********************************************************
 * EMAIL
 ***********************************************************/

openEmailGeneratorBtn?.addEventListener("click", () => {
  openModal(emailGeneratorModal);
});

generateEmailBtn?.addEventListener("click", () => {
  orderDetails.value +=
    `\nE-Mail Generator genutzt: ${emailTemplateSelect.value || "keine Vorlage"} / ${orderEmail.value || "keine E-Mail"}\n`;

  closeModal(emailGeneratorModal);
});

/***********************************************************
 * VIEW SWITCH
 ***********************************************************/

vaoOpenListBtn.addEventListener("click", () => {
  currentMainView = currentMainView === "vao" ? "week" : "vao";
  dailyViewDate = null;
  renderAll();
});

poolViewSwitchBtn?.addEventListener("click", () => {
  currentPoolView = currentPoolView === "vao" ? "control" : "vao";
  renderAll();
});

/***********************************************************
 * CLOSE BUTTONS
 ***********************************************************/

[
  [closeModalBtn, orderModal],
  [cancelBtn, orderModal],

  [closeDeleteConfirmBtn, deleteOrderConfirmModal],
  [cancelDeleteOrderBtn, deleteOrderConfirmModal],

  [closeCompletedQuestionBtn, completedQuestionModal],

  [closeEffortModalBtn, effortModal],
  [cancelEffortBtn, effortModal],

  [closeTimeModalBtn, timeModal],
  [cancelTimeBtn, timeModal],

  [closeWeekAdjustBtn, weekAdjustModal],

  [closeTeamAdjustBtn, teamAdjustModal],
  [cancelTeamAdjustBtn, teamAdjustModal],

  [closeLiveDashboardBtn, liveDashboardModal],

  [closeSearchInfoBtn, searchInfoModal],
  [closeSearchResultsBtn, searchResultsModal],

  [closePdfModalBtn, pdfModal],
  [cancelPdfBtn, pdfModal],

  [closeEmailGeneratorBtn, emailGeneratorModal],
  [cancelEmailGeneratorBtn, emailGeneratorModal],

  [closeMoveOrderBtn, moveOrderModal],
  [cancelMoveOrderBtn, moveOrderModal],

  [closeVaoMoveWarningBtn, vaoMoveWarningModal],
  [cancelVaoMoveBtn, vaoMoveWarningModal],

  [closePvsMoveChoiceBtn, pvsMoveChoiceModal],

  [closeVaoReserveConfirmBtn, vaoReserveConfirmModal],
  [cancelVaoReserveBtn, vaoReserveConfirmModal],

  [closeVaoCompleteModalBtn, vaoCompleteModal],
  [cancelVaoCompleteBtn, vaoCompleteModal],

  [closeControlCompleteBtn, controlCompleteModal],
  [cancelControlCompleteBtn, controlCompleteModal],

  [closePlanningPoolBtn, planningPoolModal],

  [closePlanningPoolScheduleBtn, planningPoolScheduleModal],
  [cancelPlanningPoolScheduleBtn, planningPoolScheduleModal],

  [closeExportBuilderBtn, exportBuilderModal]
].forEach(([btn, modal]) => {
  btn?.addEventListener("click", () => closeModal(modal));
});

/***********************************************************
 * BT / WOCHE / VIEW SWITCH
 ***********************************************************/

function renderBtDropdown() {
  if (!btDropdownMenu) return;

  btDropdownMenu.innerHTML = "";

  BTS.forEach((bt) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = bt === currentBT ? "bt-option active" : "bt-option";
    button.textContent = bt;

    button.addEventListener("click", () => {
      currentBT = bt;
      btDropdownMenu.classList.add("hidden");
      renderAll();
    });

    btDropdownMenu.appendChild(button);
  });

  btDropdownBtn.textContent = currentBT;
}

function renderPdfBtSelect() {
  if (!pdfBtSelect) return;

  pdfBtSelect.innerHTML = "";

  BTS.forEach((bt) => {
    const option = document.createElement("option");
    option.value = bt;
    option.textContent = bt;
    pdfBtSelect.appendChild(option);
  });

  pdfBtSelect.value = currentBT;
}

btDropdownBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  btDropdownMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".bt-select-wrap")) {
    btDropdownMenu?.classList.add("hidden");
  }
});

prevWeekBtn?.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 7);
  dailyViewDate = null;
  currentMainView = "week";
  renderAll();
});

nextWeekBtn?.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() + 7);
  dailyViewDate = null;
  currentMainView = "week";
  renderAll();
});

todayBtn?.addEventListener("click", () => {
  currentDate = new Date();
  dailyViewDate = null;
  currentMainView = "week";
  renderAll();
});

backToWeekBtn?.addEventListener("click", () => {
  dailyViewDate = null;
  currentMainView = "week";
  renderAll();
});

vaoOpenListBtn?.addEventListener("click", () => {
  currentMainView = currentMainView === "vao" ? "week" : "vao";
  dailyViewDate = null;
  renderAll();
});

poolViewSwitchBtn?.addEventListener("click", () => {
  currentPoolView = currentPoolView === "vao" ? "control" : "vao";
  renderAll();
});

/***********************************************************
 * INIT
 ***********************************************************/

renderBtDropdown();
renderPdfBtSelect();
updatePlanningPoolCounter();
renderAll();

/***********************************************************
 * WOCHENANPASSUNG
 ***********************************************************/

function renderWeekAdjustments() {
  weekAdjustTeamList.innerHTML = "";

  TEAMS.forEach((team) => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "adjust-team-btn";

    button.textContent = team;

    button.addEventListener("click", () => {
      selectedAdjustTeam =
        team;

      teamAdjustTitle.textContent =
        `Wochenanpassung ${team}`;

      teamAdjustStart.value =
        getCurrentWeekDates()[0];

      teamAdjustEnd.value =
        getCurrentWeekDates()[4];

      openModal(teamAdjustModal);
    });

    weekAdjustTeamList.appendChild(
      button
    );
  });

  existingAdjustmentsList.innerHTML =
    "";

  teamAdjustments
    .filter(
      (item) => item.bt === currentBT
    )
    .forEach((adjustment) => {
      const row =
        document.createElement("div");

      row.className =
        "adjustment-row";

      row.innerHTML = `
        <div>
          <strong>${adjustment.team}</strong>
          ·
          ${getAdjustmentText(adjustment.status)}
          ·
          ${formatShortDateFromIso(adjustment.startDate)}
          -
          ${formatShortDateFromIso(adjustment.endDate)}
        </div>

        <button
          type="button"
          class="delete-adjustment-btn"
        >
          ✕
        </button>
      `;

      row
        .querySelector(
          ".delete-adjustment-btn"
        )
        .addEventListener(
          "click",
          () => {
            teamAdjustments =
              teamAdjustments.filter(
                (item) =>
                  item.id !==
                  adjustment.id
              );

            renderWeekAdjustments();
            renderAll();
          }
        );

      existingAdjustmentsList.appendChild(
        row
      );
    });
}

saveTeamAdjustBtn.addEventListener(
  "click",
  () => {
    teamAdjustments.push({
      id: crypto.randomUUID(),
      bt: currentBT,
      team: selectedAdjustTeam,
      status:
        getRadioValue(
          "teamAdjustStatus"
        ),
      startDate:
        teamAdjustStart.value,
      endDate:
        teamAdjustEnd.value
    });

    closeModal(teamAdjustModal);
    renderAll();
  }
);

/***********************************************************
 * VAO
 ***********************************************************/

confirmVaoReserveBtn.addEventListener(
  "click",
  () => {
    const order =
      orders.find(
        (item) =>
          item.id ===
          pendingVaoReserveOrderId
      );

    if (!order) return;

    order.vaoReservedBy =
      getCurrentUserLabel();

    order.vaoReservedAt =
      formatDateTimeNow();

    closeModal(
      vaoReserveConfirmModal
    );

    renderAll();
  }
);

saveVaoCompleteBtn.addEventListener(
  "click",
  () => {
    const order =
      orders.find(
        (item) =>
          item.id ===
          pendingVaoCompleteOrderId
      );

    if (!order) return;

    order.vaoStatus = "gestellt";

    order.vaoStart =
      vaoCompleteStart.value;

    order.vaoEnd =
      vaoCompleteEnd.value;

    order.meters =
      vaoCompleteMeters.value;

    order.permit =
      getRadioValue(
        "vaoCompletePermit"
      );

    order.pvsRequired =
      getRadioValue(
        "vaoCompletePvs"
      );

    if (
      order.pvsRequired === "ja"
    ) {
      order.pvsSetupDate =
        calculatePvsSetupDate(
          order.date
        );
    }

    order.vaoReservedBy = "";
    order.vaoReservedAt = "";
    order.vaoProcessing = false;

    closeModal(vaoCompleteModal);

    renderAll();
  }
);

/***********************************************************
 * KONTROLLE ABSCHLIESSEN
 ***********************************************************/

saveControlCompleteBtn.addEventListener(
  "click",
  () => {
    const order =
      orders.find(
        (item) =>
          item.id ===
          pendingControlCompleteOrderId
      );

    if (!order) return;

    saveControlData(order);

    pendingControlCompleteOrderId =
      null;

    closeModal(
      controlCompleteModal
    );

    renderAll();
  }
);

controlDokuFeedback.addEventListener(
  "input",
  () => {
    const order =
      orders.find(
        (item) =>
          item.id ===
          pendingControlCompleteOrderId
      );

    if (!order) return;

    controlGeneratedText.value =
      buildControlGeneratedText(
        order
      );
  }
);

document
  .querySelectorAll(
    'input[name="controlPtiSketch"], input[name="controlSmDoku"], input[name="controlCategory"]'
  )
  .forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        const order =
          orders.find(
            (item) =>
              item.id ===
              pendingControlCompleteOrderId
          );

        if (!order) return;

        controlGeneratedText.value =
          buildControlGeneratedText(
            order
          );
      }
    );
  });

/***********************************************************
 * PLANUNGSPOOL
 ***********************************************************/

poolPlanningBtn?.addEventListener(
  "click",
  () => {
    renderPlanningPool();
    openModal(
      planningPoolModal
    );
  }
);

planningPoolDateInput?.addEventListener(
  "change",
  renderPlanningPoolLoadPreview
);

planningPoolTeamSelect?.addEventListener(
  "change",
  renderPlanningPoolLoadPreview
);

confirmPlanningPoolScheduleBtn?.addEventListener(
  "click",
  confirmPlanningPoolSchedule
);

/***********************************************************
 * EXPORT
 ***********************************************************/

clearExportColumnsBtn?.addEventListener(
  "click",
  () => {
    exportColumnsState = [null];

    renderExportBuilder();
  }
);

downloadExportBtn?.addEventListener(
  "click",
  downloadExportFile
);

exportBuilderBtn?.addEventListener(
  "click",
  () => {
    renderExportBuilder();
    openModal(
      exportBuilderModal
    );
  }
);

/***********************************************************
 * SUCHE
 ***********************************************************/

searchInput?.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Enter")
      return;

    const query =
      lower(searchInput.value);

    const results =
      orders.filter((order) =>
        [
          order.address,
          order.klsId,
          order.smNumber
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );

    searchResultsContainer.innerHTML =
      "";

    results.forEach((order) => {
      const item =
        document.createElement("div");

      item.className =
        "search-result-card";

      item.textContent =
        `${order.address} · ${order.klsId}`;

      item.addEventListener(
        "click",
        () => {
          closeModal(
            searchResultsModal
          );

          openEditOrder(
            order.id
          );
        }
      );

      searchResultsContainer.appendChild(
        item
      );
    });

    openModal(
      searchResultsModal
    );
  }
);

/***********************************************************
 * VIEW SWITCH
 ***********************************************************/

vaoOpenListBtn.addEventListener(
  "click",
  () => {
    currentMainView =
      currentMainView === "vao"
        ? "week"
        : "vao";

    renderAll();
  }
);

poolViewSwitchBtn?.addEventListener(
  "click",
  () => {
    currentPoolView =
      currentPoolView === "vao"
        ? "control"
        : "vao";

    renderAll();
  }
);

/***********************************************************
 * CLOSE BUTTONS
 ***********************************************************/

[
  [closeModalBtn, orderModal],
  [cancelBtn, orderModal],

  [
    closeDeleteConfirmBtn,
    deleteOrderConfirmModal
  ],
  [
    cancelDeleteOrderBtn,
    deleteOrderConfirmModal
  ],

  [
    closeCompletedQuestionBtn,
    completedQuestionModal
  ],

  [
    closeEffortModalBtn,
    effortModal
  ],
  [
    cancelEffortBtn,
    effortModal
  ],

  [closeTimeModalBtn, timeModal],
  [cancelTimeBtn, timeModal],

  [
    closeWeekAdjustBtn,
    weekAdjustModal
  ],

  [
    closeTeamAdjustBtn,
    teamAdjustModal
  ],
  [
    cancelTeamAdjustBtn,
    teamAdjustModal
  ],

  [
    closeLiveDashboardBtn,
    liveDashboardModal
  ],

  [
    closeSearchInfoBtn,
    searchInfoModal
  ],

  [
    closeSearchResultsBtn,
    searchResultsModal
  ],

  [
    closePdfModalBtn,
    pdfModal
  ],
  [
    cancelPdfBtn,
    pdfModal
  ],

  [
    closeEmailGeneratorBtn,
    emailGeneratorModal
  ],
  [
    cancelEmailGeneratorBtn,
    emailGeneratorModal
  ],

  [
    closeMoveOrderBtn,
    moveOrderModal
  ],
  [
    cancelMoveOrderBtn,
    moveOrderModal
  ],

  [
    closeVaoReserveConfirmBtn,
    vaoReserveConfirmModal
  ],
  [
    cancelVaoReserveBtn,
    vaoReserveConfirmModal
  ],

  [
    closeVaoCompleteModalBtn,
    vaoCompleteModal
  ],
  [
    cancelVaoCompleteBtn,
    vaoCompleteModal
  ],

  [
    closeControlCompleteBtn,
    controlCompleteModal
  ],
  [
    cancelControlCompleteBtn,
    controlCompleteModal
  ],

  [
    closePlanningPoolBtn,
    planningPoolModal
  ],

  [
    closePlanningPoolScheduleBtn,
    planningPoolScheduleModal
  ],
  [
    cancelPlanningPoolScheduleBtn,
    planningPoolScheduleModal
  ],

  [
    closeExportBuilderBtn,
    exportBuilderModal
  ]
].forEach(([btn, modal]) => {
  btn?.addEventListener(
    "click",
    () => closeModal(modal)
  );
});

/***********************************************************
 * INIT
 ***********************************************************/

pdfDateInput &&
  (pdfDateInput.value =
    getIsoDate(new Date()));

renderAll();
