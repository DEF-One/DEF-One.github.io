const orders = [];

const orderModal = document.getElementById("orderModal");
const newOrderBtn = document.getElementById("newOrderBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveOrderBtn = document.getElementById("saveOrderBtn");
const ordersTableBody = document.getElementById("ordersTableBody");

const btField = document.getElementById("btField");
const dateField = document.getElementById("dateField");
const addressField = document.getElementById("addressField");
const vaoField = document.getElementById("vaoField");
const pvsField = document.getElementById("pvsField");
const detailsField = document.getElementById("detailsField");

let editIndex = null;

function openModal() {
  orderModal.classList.remove("hidden");
}

function closeModal() {
  orderModal.classList.add("hidden");
}

function resetForm() {
  btField.value = "BT1";
  dateField.value = "";
  addressField.value = "";
  vaoField.value = "nicht gestellt";
  pvsField.value = "nichts";
  detailsField.value = "";
  editIndex = null;
}

function getVaoSymbol(status) {
  switch (status) {
    case "gestellt":
      return "?";
    case "da":
      return "!";
    case "nicht nötig":
      return "*";
    default:
      return "X";
  }
}

function renderTable() {
  if (orders.length === 0) {
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Noch keine Aufträge vorhanden.</td>
      </tr>
    `;
    return;
  }

  ordersTableBody.innerHTML = "";

  orders.forEach((order, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.bt}</td>
      <td>${order.date}</td>
      <td>${getVaoSymbol(order.vao)}   ${order.address}</td>
      <td>${order.vao}</td>
      <td>${order.pvs}</td>
    `;

    tr.addEventListener("click", () => {
      editIndex = index;
      btField.value = order.bt;
      dateField.value = order.date;
      addressField.value = order.address;
      vaoField.value = order.vao;
      pvsField.value = order.pvs;
      detailsField.value = order.details;
      openModal();
    });

    ordersTableBody.appendChild(tr);
  });
}

newOrderBtn.addEventListener("click", () => {
  resetForm();
  openModal();
});

closeModalBtn.addEventListener("click", () => {
  closeModal();
});

saveOrderBtn.addEventListener("click", () => {
  const order = {
    bt: btField.value,
    date: dateField.value,
    address: addressField.value.trim(),
    vao: vaoField.value,
    pvs: pvsField.value,
    details: detailsField.value.trim()
  };

  if (!order.address) {
    alert("Bitte eine Adresse eingeben.");
    return;
  }

  if (!order.date) {
    alert("Bitte ein Datum auswählen.");
    return;
  }

  if (editIndex === null) {
    orders.push(order);
  } else {
    orders[editIndex] = order;
  }

  renderTable();
  closeModal();
  resetForm();
});

window.addEventListener("click", (event) => {
  if (event.target === orderModal) {
    closeModal();
  }
});

renderTable();
app erstellt
