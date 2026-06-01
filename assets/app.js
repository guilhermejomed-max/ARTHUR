const STORAGE_KEY = "gestor-nf-data-v1";

const seedData = {
  clients: [
    {
      id: crypto.randomUUID(),
      document: "60.319.985/0001-44",
      name: "JOMED TRANSPORTES E LOGISTICA S/A",
      address: "RUA SISA",
      number: "261",
      zip: "07221-030",
      district: "CIDADE INDUSTRIAL SATELITE",
      city: "GUARULHOS",
      state: "SP",
      phone: "(11) 4966-8215",
    },
    {
      id: crypto.randomUUID(),
      document: "05.504.835/0001-00",
      name: "BORA TRANSPORTES LTDA",
      address: "AVENIDA Neli Ladeia",
      number: "455",
      zip: "07629-004",
      district: "Capoavinha",
      city: "MAIRIPORA",
      state: "SP",
      phone: "",
    },
    {
      id: crypto.randomUUID(),
      document: "08.979.961/0001-00",
      name: "TRANS TOP LOGISTICA E TRANSPORTE LTDA",
      address: "RUA SISA - SALA 02",
      number: "261",
      zip: "07221-030",
      district: "CIDADE INDUSTRIAL SATELITE",
      city: "GUARULHOS",
      state: "SP",
      phone: "(11) 4966-8218",
    },
    {
      id: crypto.randomUUID(),
      document: "44.471.985/0001-09",
      name: "ADVANCE TRANSATUR TRANSPORTADORA",
      address: "R JOSE SOLANA",
      number: "600",
      zip: "04829-280",
      district: "RIO BONITO",
      city: "SAO PAULO",
      state: "SP",
      phone: "",
    },
    {
      id: crypto.randomUUID(),
      document: "20.146.015/0003-31",
      name: "VIAÇÃO SÃO CRISTÓVÃO",
      address: "R: SOLDADO BENEDITO PATRICIO",
      number: "40",
      zip: "02176-040",
      district: "PARQUE NOVO MUNDO",
      city: "SAO PAULO",
      state: "SP",
      phone: "",
    },
  ],
  invoices: [],
};

seedData.invoices = [
  makeInvoice("459", seedData.clients[1], "VEICULO AZUL", 0, "PIX", "2026-03-02", "", false, "", "EM DIAGNOSTICO"),
  makeInvoice("461", seedData.clients[2], "FXK9A25", 600, "PIX", "2026-03-02", "", false, "", "PAG 09/03"),
  makeInvoice("462", seedData.clients[0], "SVL0G47", 300, "PIX", "2026-03-03", 10, true, "2026-03-06", ""),
  makeInvoice("463", seedData.clients[1], "FVC4G62", 850, "PIX", "2026-03-02", "", false, "", "PAG 18/03"),
  makeInvoice("465", seedData.clients[0], "GDD7C71", 600, "PIX", "2026-03-03", 10, true, "2026-03-10", ""),
  makeInvoice("468", seedData.clients[0], "FWO6I42", 150, "PIX", "2026-03-04", "", false, "", "FALTA NOTA"),
  makeInvoice("471", seedData.clients[0], "FPQ6D14", 550, "PIX", "2026-03-05", 10, true, "2026-03-12", ""),
  makeInvoice("472", seedData.clients[3], "FVG4A33", 900, "PIX", "2026-03-09", "", false, "", "FALTA NOTA"),
];

// Função auxiliar para carregar dados locais se não houver Firestore ativo
function loadData() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try { return JSON.parse(local); } catch { }
  }
  return { clients: [...seedData.clients], invoices: [...seedData.invoices] };
}

// Função auxiliar para salvar dados localmente (substituindo o Firebase por enquanto)
function saveStateToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadData();

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    dashboard: document.querySelector("#dashboardView"),
    notas: document.querySelector("#notasView"),
    clientes: document.querySelector("#clientesView"),
  },
  invoiceTable: document.querySelector("#invoiceTable"),
  clientTable: document.querySelector("#clientTable"),
  dueList: document.querySelector("#dueList"),
  clientSummary: document.querySelector("#clientSummary"),
  invoiceSearch: document.querySelector("#invoiceSearch"),
  clientSearch: document.querySelector("#clientSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  clientFilter: document.querySelector("#clientFilter"),
  storageCount: document.querySelector("#storageCount"),
  toast: document.querySelector("#toast"),
};

function makeInvoice(serviceOrder, client, plate, amount, paymentMethod, startDate, termDays, paid, paidDate, operationStatus) {
  return {
    id: crypto.randomUUID(),
    serviceOrder,
    clientId: client.id,
    plate,
    amount,
    paymentMethod,
    startDate,
    termDays: termDays === "" ? "" : Number(termDays),
    paid,
    paidDate,
    operationStatus,
  };
}

function withTimestamps(record) {
  return {
    ...record,
    updatedAt: new Date().toISOString(),
  };
}

async function saveClient(client) {
  const index = state.clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    state.clients[index] = withTimestamps(client);
  } else {
    state.clients.push(withTimestamps({ ...client, createdAt: new Date().toISOString() }));
  }
  saveStateToLocalStorage();
  render();
}

async function saveInvoice(invoice) {
  const index = state.invoices.findIndex(i => i.id === invoice.id);
  if (index >= 0) {
    state.invoices[index] = withTimestamps(invoice);
  } else {
    state.invoices.push(withTimestamps({ ...invoice, createdAt: new Date().toISOString() }));
  }
  saveStateToLocalStorage();
  render();
}

async function removeClient(id) {
  state.clients = state.clients.filter(c => c.id !== id);
  saveStateToLocalStorage();
  render();
}

async function removeInvoice(id) {
  state.invoices = state.invoices.filter(i => i.id !== id);
  saveStateToLocalStorage();
  render();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  const normalized = String(value || "0")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number(normalized) || 0;
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function addDays(dateString, days) {
  if (!dateString || days === "" || days === null || Number.isNaN(Number(days))) return "";
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function daysBetween(targetDate) {
  if (!targetDate) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${targetDate}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function getClient(id) {
  return state.clients.find((client) => client.id === id);
}

function getInvoiceStatus(invoice) {
  if (invoice.paid) return "pago";
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  if (dueDate && daysBetween(dueDate) < 0) return "vencido";
  return "no-prazo";
}

function statusLabel(status) {
  return {
    "no-prazo": "NO PRAZO",
    vencido: "VENCIDO",
    pago: "PAGO",
  }[status];
}

function getDueDays(invoice) {
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  if (!dueDate || invoice.paid) return "-";
  const days = daysBetween(dueDate);
  if (days < 0) return `${Math.abs(days)} venc.`;
  return String(days);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filteredInvoices() {
  const query = normalize(els.invoiceSearch.value);
  const status = els.statusFilter.value;
  const clientId = els.clientFilter.value;

  return state.invoices.filter((invoice) => {
    const client = getClient(invoice.clientId);
    const haystack = normalize(
      `${invoice.serviceOrder} ${client?.name} ${invoice.plate} ${invoice.operationStatus} ${invoice.paymentMethod}`,
    );
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === "todos" || getInvoiceStatus(invoice) === status;
    const matchesClient = clientId === "todos" || invoice.clientId === clientId;
    return matchesQuery && matchesStatus && matchesClient;
  });
}

function renderInvoices() {
  const rows = filteredInvoices();
  els.invoiceTable.innerHTML = "";

  if (!rows.length) {
    els.invoiceTable.innerHTML = `<tr><td colspan="11" class="empty">Nenhuma nota encontrada.</td></tr>`;
    return;
  }

  rows
    .sort((a, b) => Number(a.serviceOrder) - Number(b.serviceOrder))
    .forEach((invoice) => {
      const client = getClient(invoice.clientId);
      const status = getInvoiceStatus(invoice);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(invoice.serviceOrder)}</td>
        <td>${escapeHtml(client?.name || "Cliente removido")}</td>
        <td>${escapeHtml(invoice.plate || "-")}</td>
        <td>${formatMoney(invoice.amount)}</td>
        <td>${escapeHtml(invoice.paymentMethod || "-")}</td>
        <td>${formatDate(invoice.startDate)}</td>
        <td>${invoice.termDays === "" ? "-" : `${invoice.termDays} dias`}</td>
        <td>${getDueDays(invoice)}</td>
        <td><span class="status-pill status-${status}">${statusLabel(status)}</span></td>
        <td>${escapeHtml(invoice.operationStatus || "-")}</td>
        <td>
          <div class="actions-cell">
            <button class="ghost" type="button" data-edit-invoice="${invoice.id}">Editar</button>
            <button class="danger" type="button" data-delete-invoice="${invoice.id}">Excluir</button>
          </div>
        </td>
      `;
      els.invoiceTable.appendChild(row);
    });
}

function renderClients() {
  const query = normalize(els.clientSearch.value);
  const clients = state.clients.filter((client) =>
    normalize(`${client.document} ${client.name} ${client.city} ${client.phone}`).includes(query),
  );

  els.clientTable.innerHTML = "";
  if (!clients.length) {
    els.clientTable.innerHTML = `<tr><td colspan="10" class="empty">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  clients.forEach((client) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(client.document)}</td>
      <td>${escapeHtml(client.name)}</td>
      <td>${escapeHtml(client.address || "-")}</td>
      <td>${escapeHtml(client.number || "-")}</td>
      <td>${escapeHtml(client.zip || "-")}</td>
      <td>${escapeHtml(client.district || "-")}</td>
      <td>${escapeHtml(client.city || "-")}</td>
      <td>${escapeHtml(client.state || "-")}</td>
      <td>${escapeHtml(client.phone || "-")}</td>
      <td>
        <div class="actions-cell">
          <button class="ghost" type="button" data-edit-client="${client.id}">Editar</button>
          <button class="danger" type="button" data-delete-client="${client.id}">Excluir</button>
        </div>
      </td>
    `;
    els.clientTable.appendChild(row);
  });
}

function renderDashboard() {
  const groups = {
    vencido: state.invoices.filter((invoice) => getInvoiceStatus(invoice) === "vencido"),
    "no-prazo": state.invoices.filter((invoice) => getInvoiceStatus(invoice) === "no-prazo"),
    pago: state.invoices.filter((invoice) => getInvoiceStatus(invoice) === "pago"),
  };
  const sum = (items) => items.reduce((total, invoice) => total + Number(invoice.amount || 0), 0);
  const total = sum(state.invoices);

  document.querySelector("#overdueCount").textContent = groups.vencido.length;
  document.querySelector("#openCount").textContent = groups["no-prazo"].length;
  document.querySelector("#paidCount").textContent = groups.pago.length;
  document.querySelector("#overdueValue").textContent = formatMoney(sum(groups.vencido));
  document.querySelector("#openValue").textContent = formatMoney(sum(groups["no-prazo"]));
  document.querySelector("#paidValue").textContent = formatMoney(sum(groups.pago));
  document.querySelector("#totalValue").textContent = formatMoney(total);
  document.querySelector("#monthLabel").textContent = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const dueRows = state.invoices
    .filter((invoice) => !invoice.paid)
    .map((invoice) => ({ invoice, dueDate: addDays(invoice.startDate, invoice.termDays) }))
    .sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")))
    .slice(0, 6);

  els.dueList.innerHTML = dueRows.length
    ? ""
    : `<div class="empty">Não há notas abertas no momento.</div>`;

  dueRows.forEach(({ invoice, dueDate }) => {
    const client = getClient(invoice.clientId);
    const status = getInvoiceStatus(invoice);
    const item = document.createElement("article");
    item.className = "due-item";
    item.innerHTML = `
      <div>
        <strong>OS ${escapeHtml(invoice.serviceOrder)} · ${escapeHtml(client?.name || "Cliente")}</strong>
        <span>${escapeHtml(invoice.plate || "Sem placa")} · ${formatMoney(invoice.amount)} · ${escapeHtml(invoice.operationStatus || "Sem status")}</span>
      </div>
      <span class="status-pill status-${status}">${dueDate ? formatDate(dueDate) : "Sem prazo"}</span>
    `;
    els.dueList.appendChild(item);
  });

  const summaries = state.clients
    .map((client) => {
      const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id);
      const paid = sum(invoices.filter((invoice) => invoice.paid));
      const open = sum(invoices.filter((invoice) => !invoice.paid));
      return { client, paid, open, total: paid + open };
    })
    .filter((summary) => summary.total > 0)
    .sort((a, b) => b.total - a.total);

  els.clientSummary.innerHTML = summaries.length
    ? ""
    : `<tr><td colspan="3" class="empty">Sem notas lançadas.</td></tr>`;

  summaries.forEach((summary) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(summary.client.name)}</td>
      <td>${formatMoney(summary.open)}</td>
      <td>${formatMoney(summary.paid)}</td>
    `;
    els.clientSummary.appendChild(row);
  });
}

function renderSelects() {
  const clientOptions = state.clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join("");

  document.querySelector("#invoiceClient").innerHTML = clientOptions;
  els.clientFilter.innerHTML = `<option value="todos">Todos os clientes</option>${clientOptions}`;
}

function render() {
  renderSelects();
  renderInvoices();
  renderClients();
  renderDashboard();
  els.storageCount.textContent = `${state.clients.length} clientes · ${state.invoices.length} notas`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

function openDialog(id) {
  document.querySelector(`#${id}`).showModal();
}

function closeDialog(id) {
  document.querySelector(`#${id}`).close();
}

function resetInvoiceForm(invoice = null) {
  document.querySelector("#invoiceModalTitle").textContent = invoice ? "Editar nota" : "Nova nota";
  document.querySelector("#invoiceId").value = invoice?.id || "";
  document.querySelector("#serviceOrder").value = invoice?.serviceOrder || "";
  document.querySelector("#invoiceClient").value = invoice?.clientId || state.clients[0]?.id || "";
  document.querySelector("#plate").value = invoice?.plate || "";
  document.querySelector("#amount").value = invoice ? String(invoice.amount).replace(".", ",") : "";
  document.querySelector("#paymentMethod").value = invoice?.paymentMethod || "PIX";
  document.querySelector("#startDate").value = invoice?.startDate || new Date().toISOString().slice(0, 10);
  document.querySelector("#termDays").value = invoice?.termDays ?? "";
  document.querySelector("#paid").value = String(Boolean(invoice?.paid));
  document.querySelector("#paidDate").value = invoice?.paidDate || "";
  document.querySelector("#operationStatus").value = invoice?.operationStatus || "";
}

function resetClientForm(client = null) {
  document.querySelector("#clientModalTitle").textContent = client ? "Editar cliente" : "Novo cliente";
  document.querySelector("#clientId").value = client?.id || "";
  document.querySelector("#document").value = client?.document || "";
  document.querySelector("#clientName").value = client?.name || "";
  document.querySelector("#address").value = client?.address || "";
  document.querySelector("#number").value = client?.number || "";
  document.querySelector("#zip").value = client?.zip || "";
  document.querySelector("#district").value = client?.district || "";
  document.querySelector("#city").value = client?.city || "";
  document.querySelector("#state").value = client?.state || "";
  document.querySelector("#phone").value = client?.phone || "";
}

document.querySelector("#openInvoiceModal").addEventListener("click", () => {
  if (!state.clients.length) {
    showToast("Cadastre um cliente antes de lançar uma nota.");
    return;
  }
  resetInvoiceForm();
  openDialog("invoiceModal");
});

document.querySelector("#openClientModal").addEventListener("click", () => {
  resetClientForm();
  openDialog("clientModal");
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => closeDialog(button.dataset.close));
});

els.navItems.forEach((button) => {
  button.addEventListener("click", () => {
    els.navItems.forEach((item) => item.classList.toggle("active", item === button));
    Object.entries(els.views).forEach(([view, element]) => {
      element.classList.toggle("active", view === button.dataset.view);
    });
  });
});

["input", "change"].forEach((eventName) => {
  els.invoiceSearch.addEventListener(eventName, renderInvoices);
  els.clientSearch.addEventListener(eventName, renderClients);
  els.statusFilter.addEventListener(eventName, renderInvoices);
  els.clientFilter.addEventListener(eventName, renderInvoices);
});

document.querySelector("#invoiceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#invoiceId").value || crypto.randomUUID();
  const invoice = {
    id,
    serviceOrder: document.querySelector("#serviceOrder").value.trim(),
    clientId: document.querySelector("#invoiceClient").value,
    plate: document.querySelector("#plate").value.trim().toUpperCase(),
    amount: parseMoney(document.querySelector("#amount").value),
    paymentMethod: document.querySelector("#paymentMethod").value,
    startDate: document.querySelector("#startDate").value,
    termDays: document.querySelector("#termDays").value === "" ? "" : Number(document.querySelector("#termDays").value),
    paid: document.querySelector("#paid").value === "true",
    paidDate: document.querySelector("#paidDate").value,
    operationStatus: document.querySelector("#operationStatus").value.trim().toUpperCase(),
  };

  try {
    await saveInvoice(invoice);
    closeDialog("invoiceModal");
    showToast("Nota salva com sucesso.");
  } catch {
    showToast("Nao foi possivel salvar a nota.");
  }
});

document.querySelector("#clientForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#clientId").value || crypto.randomUUID();
  const client = {
    id,
    document: document.querySelector("#document").value.trim(),
    name: document.querySelector("#clientName").value.trim().toUpperCase(),
    address: document.querySelector("#address").value.trim(),
    number: document.querySelector("#number").value.trim(),
    zip: document.querySelector("#zip").value.trim(),
    district: document.querySelector("#district").value.trim(),
    city: document.querySelector("#city").value.trim().toUpperCase(),
    state: document.querySelector("#state").value.trim().toUpperCase(),
    phone: document.querySelector("#phone").value.trim(),
  };

  try {
    await saveClient(client);
    closeDialog("clientModal");
    showToast("Cliente salvo com sucesso.");
  } catch {
    showToast("Nao foi possivel salvar o cliente.");
  }
});

document.body.addEventListener("click", async (event) => {
  const editInvoiceId = event.target.dataset.editInvoice;
  const deleteInvoiceId = event.target.dataset.deleteInvoice;
  const editClientId = event.target.dataset.editClient;
  const deleteClientId = event.target.dataset.deleteClient;

  if (editInvoiceId) {
    const invoice = state.invoices.find((item) => item.id === editInvoiceId);
    resetInvoiceForm(invoice);
    openDialog("invoiceModal");
  }

  if (deleteInvoiceId && confirm("Excluir esta nota?")) {
    try {
      await removeInvoice(deleteInvoiceId);
      showToast("Nota excluida.");
    } catch {
      showToast("Nao foi possivel excluir a nota.");
    }
  }

  if (editClientId) {
    const client = state.clients.find((item) => item.id === editClientId);
    resetClientForm(client);
    openDialog("clientModal");
  }

  if (deleteClientId) {
    const hasInvoices = state.invoices.some((invoice) => invoice.clientId === deleteClientId);
    if (hasInvoices) {
      showToast("Este cliente possui notas. Exclua ou edite as notas primeiro.");
      return;
    }
    if (confirm("Excluir este cliente?")) {
      try {
        await removeClient(deleteClientId);
        showToast("Cliente excluido.");
      } catch {
        showToast("Nao foi possivel excluir o cliente.");
      }
    }
  }
});

document.querySelector("#paid").addEventListener("change", (event) => {
  const paidDate = document.querySelector("#paidDate");
  if (event.target.value === "true" && !paidDate.value) {
    paidDate.value = new Date().toISOString().slice(0, 10);
  }
});

document.querySelector("#exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gestor-nf-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#importData").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.clients) || !Array.isArray(imported.invoices)) {
      throw new Error("Formato invalido");
    }
    
    state.clients = imported.clients;
    state.invoices = imported.invoices;
    saveStateToLocalStorage();
    render();
    showToast("Backup importado com sucesso.");
  } catch {
    showToast("Nao foi possivel importar esse arquivo.");
  } finally {
    event.target.value = "";
  }
});

// ==========================================
// AUTENTICAÇÃO DO FIREBASE DESATIVADA
// ==========================================
/*
els.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticate("login");
});

els.loginButton.addEventListener("click", () => authenticate("login"));
els.signupButton.addEventListener("click", () => authenticate("signup"));
window.nfLogin = () => authenticate("login");
window.nfSignup = () => authenticate("signup");

async function authenticate(mode) { ... }
function withTimeout(promise) { ... }
function setAuthBusy(isBusy, mode) { ... }
els.logoutButton.addEventListener("click", async () => { await signOut(auth); });
onAuthStateChanged(auth, async (user) => { ... });
function authErrorMessage(code) { ... }
*/

// Inicialização direta do sistema sem depender de login
document.body.classList.remove("auth-loading", "signed-out");
document.body.classList.add("signed-in");
render();
