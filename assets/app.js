const STORAGE_KEY = "gestor-nf-data-v1";
const MAX_IMAGE_DIMENSION = 1280;
const IMAGE_QUALITY = 0.82;

let currentInvoiceImages = [];
let currentInvoiceInstallments = [];

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
  periodStart: document.querySelector("#periodStart"),
  periodEnd: document.querySelector("#periodEnd"),
  clearInvoiceFilters: document.querySelector("#clearInvoiceFilters"),
  summaryReceivedValue: document.querySelector("#summaryReceivedValue"),
  summaryPendingValue: document.querySelector("#summaryPendingValue"),
  summaryPaidValue: document.querySelector("#summaryPaidValue"),
  summaryTotalValue: document.querySelector("#summaryTotalValue"),
  summaryFilterLabel: document.querySelector("#summaryFilterLabel"),
  storageCount: document.querySelector("#storageCount"),
  toast: document.querySelector("#toast"),
};

function makeInvoice(
  serviceOrder,
  client,
  plate,
  amount,
  paymentMethod,
  startDate,
  termDays,
  paid,
  paidDate,
  operationStatus,
  workDone = "",
  partsChanged = "",
  images = [],
  installments = [],
  vehicleKm = "",
) {
  return {
    id: crypto.randomUUID(),
    serviceOrder,
    clientId: client.id,
    plate,
    vehicleKm,
    amount,
    paymentMethod,
    startDate,
    termDays: termDays === "" ? "" : Number(termDays),
    paid,
    paidDate,
    operationStatus,
    workDone,
    partsChanged,
    images,
    installments,
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

function parseKm(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatKm(value) {
  const km = parseKm(value);
  if (!km) return "-";
  return `${Number(km).toLocaleString("pt-BR")} km`;
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatPrintDate(value) {
  if (!value) return new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
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

function isInstallmentPayment(paymentMethod) {
  return normalize(paymentMethod) === "parcelado";
}

function getInstallments(invoice) {
  if (!Array.isArray(invoice?.installments)) return [];
  return invoice.installments.map((installment, index) => ({
    id: installment.id || crypto.randomUUID(),
    number: Number(installment.number || index + 1),
    paid: Boolean(installment.paid),
    paidDate: installment.paidDate || "",
  }));
}

function getInvoiceImages(invoice) {
  if (!Array.isArray(invoice?.images)) return [];
  return invoice.images.filter((image) => image?.dataUrl);
}

function isInvoicePaid(invoice) {
  const installments = getInstallments(invoice);
  if (isInstallmentPayment(invoice.paymentMethod) && installments.length) {
    return installments.every((installment) => installment.paid);
  }
  return Boolean(invoice.paid);
}

function formatPayment(invoice) {
  const method = invoice.paymentMethod || "-";
  if (!isInstallmentPayment(method)) return method;

  const installments = getInstallments(invoice);
  if (!installments.length) return "Parcelado";

  const paidCount = installments.filter((installment) => installment.paid).length;
  return `Parcelado ${paidCount}/${installments.length}`;
}

function getReceivedAmount(invoice) {
  const amount = Number(invoice.amount || 0);
  const installments = getInstallments(invoice);

  if (isInstallmentPayment(invoice.paymentMethod) && installments.length) {
    const paidCount = installments.filter((installment) => installment.paid).length;
    return amount * (paidCount / installments.length);
  }

  return isInvoicePaid(invoice) ? amount : 0;
}

function getPendingAmount(invoice) {
  return Math.max(Number(invoice.amount || 0) - getReceivedAmount(invoice), 0);
}

function getFullyPaidAmount(invoice) {
  return isInvoicePaid(invoice) ? Number(invoice.amount || 0) : 0;
}

function matchesPeriod(invoice) {
  const start = els.periodStart.value;
  const end = els.periodEnd.value;
  const invoiceDate = invoice.startDate || "";

  if (!invoiceDate && (start || end)) return false;
  if (start && invoiceDate < start) return false;
  if (end && invoiceDate > end) return false;
  return true;
}

function getInvoiceStatus(invoice) {
  if (isInvoicePaid(invoice)) return "pago";
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
  if (!dueDate || isInvoicePaid(invoice)) return "-";
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
      `${invoice.serviceOrder} ${client?.name} ${invoice.plate} ${invoice.vehicleKm} ${invoice.operationStatus} ${formatPayment(invoice)} ${invoice.workDone} ${invoice.partsChanged}`,
    );
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === "todos" || getInvoiceStatus(invoice) === status;
    const matchesClient = clientId === "todos" || invoice.clientId === clientId;
    return matchesQuery && matchesStatus && matchesClient && matchesPeriod(invoice);
  });
}

function renderFilterSummary(rows) {
  const sum = (items, getValue) => items.reduce((total, invoice) => total + getValue(invoice), 0);
  const received = sum(rows, getReceivedAmount);
  const pending = sum(rows, getPendingAmount);
  const paid = sum(rows, getFullyPaidAmount);
  const total = sum(rows, (invoice) => Number(invoice.amount || 0));

  els.summaryReceivedValue.textContent = formatMoney(received);
  els.summaryPendingValue.textContent = formatMoney(pending);
  els.summaryPaidValue.textContent = formatMoney(paid);
  els.summaryTotalValue.textContent = formatMoney(total);

  const labelParts = [];
  const query = els.invoiceSearch.value.trim();
  const client = getClient(els.clientFilter.value);
  const start = els.periodStart.value;
  const end = els.periodEnd.value;

  if (query) labelParts.push(`Busca: ${query}`);
  if (client) labelParts.push(`Cliente: ${client.name}`);
  if (start || end) {
    labelParts.push(`Periodo: ${start ? formatDate(start) : "inicio"} ate ${end ? formatDate(end) : "hoje"}`);
  }

  const countLabel = rows.length === 1 ? "1 OS encontrada" : `${rows.length} OS encontradas`;
  els.summaryFilterLabel.textContent = `${labelParts.length ? labelParts.join(" · ") : "Todos os clientes e periodos."} · ${countLabel}`;
}

function quickPaymentLabel(invoice) {
  if (isInvoicePaid(invoice)) return "PAGO";

  if (isInstallmentPayment(invoice.paymentMethod)) {
    const nextInstallment = getInstallments(invoice).find((installment) => !installment.paid);
    if (nextInstallment) return `PAGO ${nextInstallment.number}ª PARCELA`;
  }

  return "PAGO";
}

async function markNextPayment(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice || isInvoicePaid(invoice)) return;

  const today = new Date().toISOString().slice(0, 10);

  if (isInstallmentPayment(invoice.paymentMethod)) {
    const installments = getInstallments(invoice);
    const nextInstallment = installments.find((installment) => !installment.paid);

    if (nextInstallment) {
      nextInstallment.paid = true;
      nextInstallment.paidDate = nextInstallment.paidDate || today;

      const paid = installments.every((installment) => installment.paid);
      await saveInvoice({
        ...invoice,
        installments,
        paid,
        paidDate: latestPaidInstallmentDate(installments),
      });
      showToast(paid ? "OS quitada." : `${nextInstallment.number}ª parcela marcada como paga.`);
      return;
    }
  }

  await saveInvoice({
    ...invoice,
    paid: true,
    paidDate: invoice.paidDate || today,
  });
  showToast("OS marcada como paga.");
}

function renderInvoices() {
  const rows = filteredInvoices();
  renderFilterSummary(rows);
  els.invoiceTable.innerHTML = "";

  if (!rows.length) {
    els.invoiceTable.innerHTML = `<tr><td colspan="12" class="empty">Nenhuma nota encontrada.</td></tr>`;
    return;
  }

  rows
    .sort((a, b) => Number(a.serviceOrder) - Number(b.serviceOrder))
    .forEach((invoice) => {
      const client = getClient(invoice.clientId);
      const status = getInvoiceStatus(invoice);
      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.tabIndex = 0;
      row.dataset.openInvoice = invoice.id;
      row.innerHTML = `
        <td>${escapeHtml(invoice.serviceOrder)}</td>
        <td>${escapeHtml(client?.name || "Cliente removido")}</td>
        <td>${escapeHtml(invoice.plate || "-")}</td>
        <td>${escapeHtml(formatKm(invoice.vehicleKm))}</td>
        <td>${formatMoney(invoice.amount)}</td>
        <td>${escapeHtml(formatPayment(invoice))}</td>
        <td>${formatDate(invoice.startDate)}</td>
        <td>${invoice.termDays === "" ? "-" : `${invoice.termDays} dias`}</td>
        <td>${getDueDays(invoice)}</td>
        <td><span class="status-pill status-${status}">${statusLabel(status)}</span></td>
        <td>${escapeHtml(invoice.operationStatus || "-")}</td>
        <td>
          <div class="actions-cell">
            <button class="quick-pay" type="button" data-quick-pay="${invoice.id}" ${isInvoicePaid(invoice) ? "disabled" : ""}>${escapeHtml(quickPaymentLabel(invoice))}</button>
            <button class="ghost" type="button" data-open-invoice="${invoice.id}">Ver</button>
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
    .filter((invoice) => !isInvoicePaid(invoice))
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
        <span>${escapeHtml(invoice.plate || "Sem placa")} · ${formatMoney(invoice.amount)} · ${escapeHtml(formatPayment(invoice))} · ${escapeHtml(invoice.operationStatus || "Sem status")}</span>
      </div>
      <span class="status-pill status-${status}">${dueDate ? formatDate(dueDate) : "Sem prazo"}</span>
    `;
    els.dueList.appendChild(item);
  });

  const summaries = state.clients
    .map((client) => {
      const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id);
      const paid = sum(invoices.filter((invoice) => isInvoicePaid(invoice)));
      const open = sum(invoices.filter((invoice) => !isInvoicePaid(invoice)));
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
  const currentInvoiceClient = document.querySelector("#invoiceClient").value;
  const currentClientFilter = els.clientFilter.value;
  const clientOptions = state.clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join("");

  document.querySelector("#invoiceClient").innerHTML = clientOptions;
  els.clientFilter.innerHTML = `<option value="todos">Todos os clientes</option>${clientOptions}`;

  if (state.clients.some((client) => client.id === currentInvoiceClient)) {
    document.querySelector("#invoiceClient").value = currentInvoiceClient;
  }

  els.clientFilter.value = state.clients.some((client) => client.id === currentClientFilter)
    ? currentClientFilter
    : "todos";
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

function clampInstallmentCount(value) {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 1) return 0;
  return Math.min(count, 36);
}

function buildInstallments(count, existing = currentInvoiceInstallments) {
  const safeCount = clampInstallmentCount(count);
  return Array.from({ length: safeCount }, (_, index) => {
    const number = index + 1;
    const previous = existing.find((installment) => Number(installment.number) === number) || existing[index];
    return {
      id: previous?.id || crypto.randomUUID(),
      number,
      paid: Boolean(previous?.paid),
      paidDate: previous?.paidDate || "",
    };
  });
}

function renderInstallmentList() {
  const list = document.querySelector("#installmentList");
  const count = clampInstallmentCount(document.querySelector("#installmentCount").value);

  if (!count) {
    list.innerHTML = `<p class="muted-note">Informe a quantidade de parcelas.</p>`;
    return;
  }

  list.innerHTML = currentInvoiceInstallments
    .map((installment) => `
      <div class="installment-item">
        <input type="checkbox" data-installment-paid="${installment.id}" ${installment.paid ? "checked" : ""} aria-label="Parcela ${installment.number} paga" />
        <strong>${installment.number}ª parcela</strong>
        <input type="date" data-installment-date="${installment.id}" value="${escapeHtml(installment.paidDate)}" ${installment.paid ? "" : "disabled"} aria-label="Data de pagamento da parcela ${installment.number}" />
      </div>
    `)
    .join("");
}

function updatePaymentFields() {
  const paymentMethod = document.querySelector("#paymentMethod").value;
  const installmentSection = document.querySelector("#installmentSection");
  const installmentCount = document.querySelector("#installmentCount");
  const isParcelado = isInstallmentPayment(paymentMethod);

  installmentSection.hidden = !isParcelado;
  document.querySelector("#paidGroup").hidden = isParcelado;
  document.querySelector("#paidDateGroup").hidden = isParcelado;

  if (!isParcelado) {
    document.querySelector("#installmentList").innerHTML = "";
    return;
  }

  if (!installmentCount.value) {
    installmentCount.value = currentInvoiceInstallments.length || 2;
  }

  const count = clampInstallmentCount(installmentCount.value);
  installmentCount.value = count || "";
  currentInvoiceInstallments = buildInstallments(count);
  renderInstallmentList();
}

function renderImagePreview() {
  const preview = document.querySelector("#invoiceImagePreview");

  if (!currentInvoiceImages.length) {
    preview.innerHTML = `<p class="muted-note">Nenhuma imagem adicionada.</p>`;
    return;
  }

  preview.innerHTML = currentInvoiceImages
    .map((image) => `
      <article class="image-preview">
        <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
        <footer>
          <span title="${escapeHtml(image.name || "Imagem")}">${escapeHtml(image.name || "Imagem")}</span>
          <button class="danger" type="button" data-remove-image="${image.id}">Remover</button>
        </footer>
      </article>
    `)
    .join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl, mimeType) {
  return new Promise((resolve) => {
    const image = new Image();

    image.addEventListener("load", () => {
      const largestSide = Math.max(image.width, image.height);
      const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      if (scale === 1 && dataUrl.length < 900000) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);

      const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(outputType, IMAGE_QUALITY));
    });

    image.addEventListener("error", () => resolve(dataUrl));
    image.src = dataUrl;
  });
}

async function imageFileToRecord(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    dataUrl: await resizeImageDataUrl(dataUrl, file.type),
  };
}

function latestPaidInstallmentDate(installments) {
  const dates = installments
    .filter((installment) => installment.paid && installment.paidDate)
    .map((installment) => installment.paidDate)
    .sort();
  return dates[dates.length - 1] || "";
}

function renderDetailField(label, value) {
  return `
    <div class="detail-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "-")}</strong>
    </div>
  `;
}

function renderDetailBlock(label, value) {
  return `
    <div class="detail-block wide">
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(value || "-")}</p>
    </div>
  `;
}

function formatClientAddress(client) {
  if (!client) return "-";
  return [
    client.address,
    client.number,
    client.district,
    client.city,
    client.state,
    client.zip,
  ].filter(Boolean).join(" - ");
}

function printText(value) {
  return escapeHtml(value || "-").replace(/\n/g, "<br>");
}

function formatPrintAmount(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPrintableServiceDescription(invoice) {
  const lines = [];
  const vehicleParts = [];

  if (invoice.plate) vehicleParts.push(`Veiculo de placa ${invoice.plate}`);
  if (invoice.vehicleKm) vehicleParts.push(`KM ${formatKm(invoice.vehicleKm)}`);
  if (vehicleParts.length) lines.push(vehicleParts.join(" - "));
  if (invoice.workDone) lines.push(invoice.workDone);
  if (invoice.partsChanged) lines.push(`Itens trocados: ${invoice.partsChanged}`);
  if (!invoice.workDone && !invoice.partsChanged && invoice.operationStatus) lines.push(invoice.operationStatus);

  return lines.join("\n") || "Servicos prestados.";
}

function renderPrintImages(images) {
  if (!images.length) return "";

  return `
    <section class="print-images">
      <h2>Imagens da OS</h2>
      <div class="print-image-grid">
        ${images.map((image) => `
          <figure>
            <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
            <figcaption>${escapeHtml(image.name || "Imagem da OS")}</figcaption>
          </figure>
        `).join("")}
      </div>
    </section>
  `;
}

function buildPrintableOrderHtml(invoice) {
  const client = getClient(invoice.clientId);
  const images = getInvoiceImages(invoice);
  const total = Number(invoice.amount || 0);
  const pending = getPendingAmount(invoice);
  const received = getReceivedAmount(invoice);
  const serviceDescription = getPrintableServiceDescription(invoice);
  const clientAddress = formatClientAddress(client);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Ordem de Servico ${escapeHtml(invoice.serviceOrder || "")}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #151515;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.35;
    }
    .page {
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
    }
    .top {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: start;
      padding-bottom: 18px;
      border-bottom: 1px solid #d7d7d7;
    }
    .payment-title {
      font-size: 12px;
      font-weight: 700;
    }
    .order-title {
      text-align: right;
    }
    .order-title h1 {
      margin: 0 0 10px;
      font-size: 22px;
      font-weight: 700;
    }
    .order-title .date {
      margin-bottom: 6px;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      padding: 5px 18px;
      border: 1px solid #444;
      font-weight: 700;
      letter-spacing: 0;
    }
    .company {
      padding: 18px 0;
      display: grid;
      gap: 3px;
    }
    .company strong {
      font-size: 13px;
    }
    .bill-box {
      margin: 4px 0 22px;
      border-top: 1px solid #1d1d1d;
      border-bottom: 1px solid #d7d7d7;
      padding: 10px 0 12px;
    }
    .label {
      margin-bottom: 8px;
      color: #444;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .bill-box strong {
      display: block;
      margin-bottom: 4px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      padding: 8px 6px;
      border-bottom: 1px solid #1d1d1d;
      color: #333;
      font-size: 11px;
      text-align: left;
    }
    td {
      padding: 10px 6px;
      border-bottom: 1px solid #e5e5e5;
      vertical-align: top;
    }
    .qty,
    .amount {
      width: 90px;
      text-align: right;
      white-space: nowrap;
    }
    .product-title {
      display: block;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .totals {
      display: grid;
      justify-content: end;
      gap: 6px;
      margin: 12px 0 20px auto;
      width: min(300px, 100%);
    }
    .totals div {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
    }
    .totals strong {
      font-weight: 700;
    }
    .print-images {
      margin: 18px 0 22px;
      page-break-inside: avoid;
    }
    .print-images h2 {
      margin: 0 0 10px;
      font-size: 13px;
    }
    .print-image-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    figure {
      margin: 0;
      border: 1px solid #d7d7d7;
      page-break-inside: avoid;
    }
    figure img {
      display: block;
      width: 100%;
      max-height: 260px;
      object-fit: contain;
      background: #f7f7f7;
    }
    figcaption {
      padding: 5px 7px;
      color: #555;
      font-size: 10px;
      border-top: 1px solid #e2e2e2;
    }
    .observe {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #d7d7d7;
    }
    .observe h2 {
      margin: 0 0 8px;
      font-size: 13px;
    }
    .signature {
      margin-top: 18px;
      display: grid;
      gap: 3px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="top">
      <div class="payment-title">Informacoes de pagamentos</div>
      <div class="order-title">
        <h1>Ordem De Servico ${escapeHtml(invoice.serviceOrder || "-")}</h1>
        <div class="date">${formatPrintDate(invoice.startDate)}</div>
        <span class="badge">FATURA</span>
      </div>
    </header>

    <section class="company">
      <strong>54.348.335 ARTHUR RODRIGUES DE LIMA</strong>
      <span>Viela Betania, 4 - Jardim Albertina, Guarulhos - SP, 07243-502</span>
      <span>11982747107</span>
      <span>arthur-rl@hotmail.com</span>
      <span>CPF : 47656650890</span>
    </section>

    <section class="bill-box">
      <div class="label">BILL PARA</div>
      <strong>${escapeHtml(client?.name || "Cliente")}</strong>
      <span>${escapeHtml(clientAddress)}</span><br />
      <span>${escapeHtml(client?.phone || "")}</span>
    </section>

    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th class="qty">Quant</th>
          <th class="amount">Montante</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <span class="product-title">Servicos Prestados</span>
            ${printText(serviceDescription)}
          </td>
          <td class="qty">1.00</td>
          <td class="amount">${formatPrintAmount(total)}</td>
        </tr>
      </tbody>
    </table>

    <section class="totals">
      <div><span>Total</span><strong>${formatMoney(total)}</strong></div>
      <div><span>Total geral</span><strong>${formatMoney(total)}</strong></div>
      <div><span>Recebido</span><strong>${formatMoney(received)}</strong></div>
      <div><span>Saldo</span><strong>${formatMoney(pending)}</strong></div>
    </section>

    ${renderPrintImages(images)}

    <section class="observe">
      <h2>Observe</h2>
      <div>1. Muito Obrigado</div>
      <div>Pix 11982747107</div>
      <div class="signature">
        <strong>Arthur Rodrigues de Lima</strong>
        <span>CNPJ: 54.348.335/0001-24</span>
      </div>
    </section>
  </main>
  <script>
    window.addEventListener("load", function () {
      var images = Array.prototype.slice.call(document.images);
      var waits = images.map(function (image) {
        if (image.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          image.onload = resolve;
          image.onerror = resolve;
        });
      });
      Promise.all(waits).then(function () {
        setTimeout(function () { window.print(); }, 200);
      });
    });
  </script>
</body>
</html>`;
}

function printInvoice(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast("Permita pop-ups para imprimir a OS.");
    return;
  }

  printWindow.document.write(buildPrintableOrderHtml(invoice));
  printWindow.document.close();
  printWindow.focus();
}

function renderInvoiceDetail(invoice) {
  const client = getClient(invoice.clientId);
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  const status = getInvoiceStatus(invoice);
  const installments = getInstallments(invoice);
  const images = getInvoiceImages(invoice);

  document.querySelector("#invoiceDetailTitle").textContent = `OS ${invoice.serviceOrder || "-"}`;
  document.querySelector("#editInvoiceFromDetail").dataset.editInvoice = invoice.id;
  document.querySelector("#printInvoiceFromDetail").dataset.printInvoice = invoice.id;

  const installmentContent = installments.length
    ? installments
      .map((installment) => `
        <div class="installment-item">
          <span class="status-pill status-${installment.paid ? "pago" : "no-prazo"}">${installment.paid ? "PAGA" : "ABERTA"}</span>
          <strong>${installment.number}ª parcela</strong>
          <span>${installment.paidDate ? formatDate(installment.paidDate) : "Sem data"}</span>
        </div>
      `)
      .join("")
    : `<p class="muted-note">Nenhuma parcela cadastrada.</p>`;

  const imageContent = images.length
    ? images
      .map((image) => `
        <a class="detail-image" href="${escapeHtml(image.dataUrl)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
        </a>
      `)
      .join("")
    : `<p class="muted-note">Nenhuma imagem adicionada.</p>`;

  document.querySelector("#invoiceDetailContent").innerHTML = `
    <section class="detail-grid">
      ${renderDetailField("OS", invoice.serviceOrder)}
      ${renderDetailField("Cliente", client?.name || "Cliente removido")}
      ${renderDetailField("CPF/CNPJ", client?.document)}
      ${renderDetailField("Telefone", client?.phone)}
      ${renderDetailField("Placa", invoice.plate)}
      ${renderDetailField("KM do veiculo", formatKm(invoice.vehicleKm))}
      ${renderDetailField("Valor", formatMoney(invoice.amount))}
      ${renderDetailField("Pagamento", formatPayment(invoice))}
      ${renderDetailField("Data inicial", formatDate(invoice.startDate))}
      ${renderDetailField("Prazo", invoice.termDays === "" ? "-" : `${invoice.termDays} dias`)}
      ${renderDetailField("Vencimento", dueDate ? formatDate(dueDate) : "Sem prazo")}
      ${renderDetailField("Situação", statusLabel(status))}
      ${renderDetailField("Status", invoice.operationStatus)}
      ${renderDetailBlock("Endereço", formatClientAddress(client))}
      ${renderDetailBlock("O que foi feito", invoice.workDone)}
      ${renderDetailBlock("O que foi trocado", invoice.partsChanged)}
    </section>
    <section class="detail-block wide">
      <span>Parcelas</span>
      <div class="installment-list">${installmentContent}</div>
    </section>
    <section class="detail-block wide">
      <span>Imagens da OS</span>
      <div class="detail-image-grid">${imageContent}</div>
    </section>
  `;
}

function openInvoiceDetail(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;

  renderInvoiceDetail(invoice);
  openDialog("invoiceDetailModal");
}

function openDialog(id) {
  document.querySelector(`#${id}`).showModal();
}

function closeDialog(id) {
  document.querySelector(`#${id}`).close();
}

function resetInvoiceForm(invoice = null) {
  document.querySelector("#invoiceModalTitle").textContent = invoice ? "Editar OS" : "Nova OS";
  document.querySelector("#invoiceId").value = invoice?.id || "";
  document.querySelector("#serviceOrder").value = invoice?.serviceOrder || "";
  document.querySelector("#invoiceClient").value = invoice?.clientId || state.clients[0]?.id || "";
  document.querySelector("#plate").value = invoice?.plate || "";
  document.querySelector("#vehicleKm").value = invoice?.vehicleKm || "";
  document.querySelector("#amount").value = invoice ? String(invoice.amount).replace(".", ",") : "";
  document.querySelector("#paymentMethod").value = isInstallmentPayment(invoice?.paymentMethod) ? "PARCELADO" : invoice?.paymentMethod || "PIX";
  document.querySelector("#startDate").value = invoice?.startDate || new Date().toISOString().slice(0, 10);
  document.querySelector("#termDays").value = invoice?.termDays ?? "";
  document.querySelector("#paid").value = String(isInvoicePaid(invoice || {}));
  document.querySelector("#paidDate").value = invoice?.paidDate || "";
  document.querySelector("#operationStatus").value = invoice?.operationStatus || "";
  document.querySelector("#workDone").value = invoice?.workDone || "";
  document.querySelector("#partsChanged").value = invoice?.partsChanged || "";
  document.querySelector("#invoiceImages").value = "";

  currentInvoiceImages = getInvoiceImages(invoice);
  currentInvoiceInstallments = getInstallments(invoice);
  document.querySelector("#installmentCount").value = currentInvoiceInstallments.length || "";
  updatePaymentFields();
  renderImagePreview();
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
  els.periodStart.addEventListener(eventName, renderInvoices);
  els.periodEnd.addEventListener(eventName, renderInvoices);
});

els.clearInvoiceFilters.addEventListener("click", () => {
  els.invoiceSearch.value = "";
  els.statusFilter.value = "todos";
  els.clientFilter.value = "todos";
  els.periodStart.value = "";
  els.periodEnd.value = "";
  renderInvoices();
});

document.querySelector("#paymentMethod").addEventListener("change", updatePaymentFields);

document.querySelector("#installmentCount").addEventListener("input", (event) => {
  const count = clampInstallmentCount(event.target.value);
  currentInvoiceInstallments = buildInstallments(count);
  renderInstallmentList();
});

document.querySelector("#installmentList").addEventListener("change", (event) => {
  const paidId = event.target.dataset.installmentPaid;
  const dateId = event.target.dataset.installmentDate;

  if (paidId) {
    const installment = currentInvoiceInstallments.find((item) => item.id === paidId);
    if (!installment) return;

    installment.paid = event.target.checked;
    installment.paidDate = event.target.checked
      ? installment.paidDate || new Date().toISOString().slice(0, 10)
      : "";
    renderInstallmentList();
  }

  if (dateId) {
    const installment = currentInvoiceInstallments.find((item) => item.id === dateId);
    if (!installment) return;

    installment.paidDate = event.target.value;
  }
});

document.querySelector("#invoiceImages").addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  try {
    showToast("Processando imagens...");
    const images = await Promise.all(files.map(imageFileToRecord));
    currentInvoiceImages = [...currentInvoiceImages, ...images];
    renderImagePreview();
    showToast(images.length === 1 ? "Imagem adicionada." : "Imagens adicionadas.");
  } catch {
    showToast("Nao foi possivel adicionar as imagens.");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#invoiceImagePreview").addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-image]");
  if (!removeButton) return;

  currentInvoiceImages = currentInvoiceImages.filter((image) => image.id !== removeButton.dataset.removeImage);
  renderImagePreview();
});

document.querySelector("#invoiceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#invoiceId").value || crypto.randomUUID();
  const paymentMethod = document.querySelector("#paymentMethod").value;
  const installments = isInstallmentPayment(paymentMethod) ? currentInvoiceInstallments : [];
  const paidByInstallments = installments.length > 0 && installments.every((installment) => installment.paid);
  const paidDateByInstallments = latestPaidInstallmentDate(installments);
  const invoice = {
    id,
    serviceOrder: document.querySelector("#serviceOrder").value.trim(),
    clientId: document.querySelector("#invoiceClient").value,
    plate: document.querySelector("#plate").value.trim().toUpperCase(),
    vehicleKm: parseKm(document.querySelector("#vehicleKm").value),
    amount: parseMoney(document.querySelector("#amount").value),
    paymentMethod,
    startDate: document.querySelector("#startDate").value,
    termDays: document.querySelector("#termDays").value === "" ? "" : Number(document.querySelector("#termDays").value),
    paid: isInstallmentPayment(paymentMethod) ? paidByInstallments : document.querySelector("#paid").value === "true",
    paidDate: isInstallmentPayment(paymentMethod) ? paidDateByInstallments : document.querySelector("#paidDate").value,
    operationStatus: document.querySelector("#operationStatus").value.trim().toUpperCase(),
    workDone: document.querySelector("#workDone").value.trim(),
    partsChanged: document.querySelector("#partsChanged").value.trim(),
    images: currentInvoiceImages,
    installments,
  };

  try {
    await saveInvoice(invoice);
    closeDialog("invoiceModal");
    showToast("OS salva com sucesso.");
  } catch (error) {
    const quotaExceeded = error?.name === "QuotaExceededError" || error?.code === 22;
    showToast(quotaExceeded ? "Nao foi possivel salvar: reduza a quantidade de imagens." : "Nao foi possivel salvar a OS.");
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
  const quickPayId = event.target.closest("[data-quick-pay]")?.dataset.quickPay;
  const printInvoiceId = event.target.closest("[data-print-invoice]")?.dataset.printInvoice;
  const editInvoiceId = event.target.closest("[data-edit-invoice]")?.dataset.editInvoice;
  const deleteInvoiceId = event.target.closest("[data-delete-invoice]")?.dataset.deleteInvoice;
  const openInvoiceId = event.target.closest("[data-open-invoice]")?.dataset.openInvoice;
  const editClientId = event.target.closest("[data-edit-client]")?.dataset.editClient;
  const deleteClientId = event.target.closest("[data-delete-client]")?.dataset.deleteClient;

  if (quickPayId) {
    await markNextPayment(quickPayId);
    return;
  }

  if (printInvoiceId) {
    printInvoice(printInvoiceId);
    return;
  }

  if (editInvoiceId) {
    const invoice = state.invoices.find((item) => item.id === editInvoiceId);
    if (document.querySelector("#invoiceDetailModal").open) {
      closeDialog("invoiceDetailModal");
    }
    resetInvoiceForm(invoice);
    openDialog("invoiceModal");
    return;
  }

  if (deleteInvoiceId) {
    if (confirm("Excluir esta OS?")) {
      try {
        await removeInvoice(deleteInvoiceId);
        showToast("OS excluida.");
      } catch {
        showToast("Nao foi possivel excluir a OS.");
      }
    }
    return;
  }

  if (openInvoiceId) {
    openInvoiceDetail(openInvoiceId);
    return;
  }

  if (editClientId) {
    const client = state.clients.find((item) => item.id === editClientId);
    resetClientForm(client);
    openDialog("clientModal");
    return;
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

document.body.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const row = event.target.closest(".clickable-row");
  const openInvoiceId = row?.dataset.openInvoice;
  if (!openInvoiceId) return;

  openInvoiceDetail(openInvoiceId);
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
