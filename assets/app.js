const STORAGE_KEY = "gestor-nf-data-v1";
const BACKUP_STORAGE_KEY = "gestor-nf-data-v1-backup";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_INVOICE_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_INVOICE_IMAGES = 8;
const INVOICE_IMAGE_MAX_DIMENSION = 1400;

const defaultSettings = {
  companyName: "",
  companyCnpj: "",
  companyNumber: "",
  companyLogo: "",
};

const seedData = {
  clients: [
    {
      id: makeId(),
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
      id: makeId(),
      document: "05.504.835/0001-00",
      name: "BORA TRANSPORTES LTDA",
      address: "AVENIDA NELI LADEIA",
      number: "455",
      zip: "07629-004",
      district: "CAPOAVINHA",
      city: "MAIRIPORA",
      state: "SP",
      phone: "",
    },
    {
      id: makeId(),
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
      id: makeId(),
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
      id: makeId(),
      document: "20.146.015/0003-31",
      name: "VIACAO SAO CRISTOVAO",
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
  settings: defaultSettings,
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

let state = loadData();
let currentInvoiceImages = [];
let currentSummaryInvoiceId = "";

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    dashboard: document.querySelector("#dashboardView"),
    notas: document.querySelector("#notasView"),
    clientes: document.querySelector("#clientesView"),
    configuracoes: document.querySelector("#configuracoesView"),
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
  exportModal: document.querySelector("#exportModal"),
  companyForm: document.querySelector("#companyForm"),
  companyName: document.querySelector("#companyName"),
  companyCnpj: document.querySelector("#companyCnpj"),
  companyNumber: document.querySelector("#companyNumber"),
  companyLogo: document.querySelector("#companyLogo"),
  logoPreview: document.querySelector("#logoPreview"),
  logoImage: document.querySelector("#logoImage"),
  logoEmpty: document.querySelector("#logoEmpty"),
  removeLogo: document.querySelector("#removeLogo"),
  invoiceImages: document.querySelector("#invoiceImages"),
  invoiceImagePreview: document.querySelector("#invoiceImagePreview"),
  installmentsLabel: document.querySelector("#installmentsLabel"),
  installments: document.querySelector("#installments"),
  paidInstallmentsLabel: document.querySelector("#paidInstallmentsLabel"),
  paidInstallments: document.querySelector("#paidInstallments"),
  invoiceSummaryModal: document.querySelector("#invoiceSummaryModal"),
  invoiceSummaryTitle: document.querySelector("#invoiceSummaryTitle"),
  invoiceSummaryContent: document.querySelector("#invoiceSummaryContent"),
  summaryEditInvoice: document.querySelector("#summaryEditInvoice"),
  summaryPrintInvoice: document.querySelector("#summaryPrintInvoice"),
};

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeInvoice(serviceOrder, client, plate, amount, paymentMethod, startDate, termDays, paid, paidDate, operationStatus) {
  return {
    id: makeId(),
    serviceOrder,
    fiscalNote: "",
    clientId: client.id,
    plate,
    vehicleKm: "",
    amount,
    paymentMethod,
    installments: "",
    paidInstallments: 0,
    startDate,
    termDays: termDays === "" ? "" : Number(termDays),
    paid,
    paidDate,
    operationStatus,
    images: [],
  };
}

function loadData() {
  const stored = readStoredData(STORAGE_KEY);
  if (isValidStoredState(stored)) return stored;

  const backup = readStoredData(BACKUP_STORAGE_KEY);
  if (isValidStoredState(backup)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
    return backup;
  }

  return normalizeState(seedData);
}

function readStoredData(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? normalizeState(JSON.parse(stored)) : null;
  } catch (error) {
    console.warn("Nao foi possivel carregar os dados locais.", error);
    return null;
  }
}

function normalizeState(data) {
  return {
    schemaVersion: Number(data?.schemaVersion) || 0,
    clients: Array.isArray(data?.clients) ? data.clients : [],
    invoices: Array.isArray(data?.invoices) ? data.invoices.map(normalizeInvoice) : [],
    settings: {
      ...defaultSettings,
      ...(data?.settings || {}),
    },
  };
}

function isValidStoredState(data) {
  return Boolean(data && (data.schemaVersion >= 2 || hasUsefulData(data)));
}

function hasUsefulData(data) {
  if (!data) return false;
  const settings = data.settings || {};
  return (
    data.clients.length > 0 ||
    data.invoices.length > 0 ||
    Boolean(settings.companyName || settings.companyCnpj || settings.companyNumber || settings.companyLogo)
  );
}

function normalizeInvoice(invoice) {
  const normalized = {
    fiscalNote: "",
    vehicleKm: "",
    installments: "",
    paidInstallments: 0,
    images: [],
    ...invoice,
    images: Array.isArray(invoice?.images) ? invoice.images : [],
  };
  if (isInstallmentPayment(normalized)) {
    const installments = Number(normalized.installments || 0);
    if (normalized.paid && !Number(normalized.paidInstallments || 0)) {
      normalized.paidInstallments = installments;
    }
  } else {
    normalized.paidInstallments = 0;
  }
  return normalized;
}

function saveData() {
  const previous = readStoredData(STORAGE_KEY);
  if (isValidStoredState(previous)) {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(previous));
  }
  state.schemaVersion = 2;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function saveClient(client) {
  const index = state.clients.findIndex((item) => item.id === client.id);
  if (index >= 0) {
    state.clients[index] = client;
  } else {
    state.clients.push(client);
  }
  saveData();
  render();
}

async function saveInvoice(invoice) {
  const index = state.invoices.findIndex((item) => item.id === invoice.id);
  if (index >= 0) {
    state.invoices[index] = invoice;
  } else {
    state.invoices.push(invoice);
  }
  saveData();
  render();
}

async function removeClient(id) {
  state.clients = state.clients.filter((client) => client.id !== id);
  saveData();
  render();
}

async function removeInvoice(id) {
  state.invoices = state.invoices.filter((invoice) => invoice.id !== id);
  saveData();
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

function compareInvoices(a, b) {
  return String(a.serviceOrder || "").localeCompare(String(b.serviceOrder || ""), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

function filteredInvoices() {
  const query = normalize(els.invoiceSearch.value);
  const status = els.statusFilter.value;
  const clientId = els.clientFilter.value;

  return state.invoices.filter((invoice) => {
    const client = getClient(invoice.clientId);
    const haystack = normalize(
      `${invoice.serviceOrder} ${invoice.fiscalNote} ${invoice.vehicleKm} ${invoice.installments} ${client?.name} ${invoice.plate} ${invoice.operationStatus} ${invoice.paymentMethod}`,
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
    els.invoiceTable.innerHTML = `<tr><td colspan="12" class="empty">Nenhuma nota encontrada.</td></tr>`;
    return;
  }

  rows
    .slice()
    .sort(compareInvoices)
    .forEach((invoice) => {
      const client = getClient(invoice.clientId);
      const status = getInvoiceStatus(invoice);
      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.dataset.viewInvoiceRow = invoice.id;
      row.innerHTML = `
        <td><button class="os-link" type="button" data-view-invoice="${invoice.id}">OS ${escapeHtml(invoice.serviceOrder)}</button></td>
        <td>${escapeHtml(invoice.fiscalNote || "-")}</td>
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
            <button class="ghost payment-action" type="button" data-inform-payment="${invoice.id}" ${isPaymentComplete(invoice) ? "disabled" : ""}>${paymentButtonLabel(invoice)}</button>
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

  clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((client) => {
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

  els.dueList.innerHTML = dueRows.length ? "" : `<div class="empty">Não há notas abertas no momento.</div>`;

  dueRows.forEach(({ invoice, dueDate }) => {
    const client = getClient(invoice.clientId);
    const status = getInvoiceStatus(invoice);
    const item = document.createElement("article");
    item.className = "due-item";
    item.innerHTML = `
      <div>
        <strong>OS ${escapeHtml(invoice.serviceOrder)} · ${escapeHtml(client?.name || "Cliente")}</strong>
        <span>${escapeHtml(invoice.fiscalNote || "Sem NF")} · ${escapeHtml(invoice.plate || "Sem placa")} · ${formatMoney(invoice.amount)} · ${escapeHtml(invoice.operationStatus || "Sem status")}</span>
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

  els.clientSummary.innerHTML = summaries.length ? "" : `<tr><td colspan="3" class="empty">Sem notas lançadas.</td></tr>`;

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

  document.querySelector("#invoiceClient").innerHTML = clientOptions || `<option value="">Cadastre um cliente</option>`;
  els.clientFilter.innerHTML = `<option value="todos">Todos os clientes</option>${clientOptions}`;
}

function renderSettings() {
  const settings = state.settings;
  els.companyName.value = settings.companyName || "";
  els.companyCnpj.value = settings.companyCnpj || "";
  els.companyNumber.value = settings.companyNumber || "";
  els.companyLogo.value = "";

  if (settings.companyLogo) {
    els.logoImage.src = settings.companyLogo;
    els.logoPreview.classList.add("has-logo");
    els.logoEmpty.hidden = true;
  } else {
    els.logoImage.removeAttribute("src");
    els.logoPreview.classList.remove("has-logo");
    els.logoEmpty.hidden = false;
  }
}

function renderInvoiceImagePreview() {
  const images = currentInvoiceImages;
  els.invoiceImagePreview.innerHTML = "";

  if (!images.length) {
    els.invoiceImagePreview.innerHTML = `<div class="image-empty">Nenhuma imagem anexada.</div>`;
    return;
  }

  images.forEach((image) => {
    const item = document.createElement("article");
    item.className = "invoice-image-chip";
    item.innerHTML = `
      <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
      <div>
        <strong>${escapeHtml(image.name || "Imagem da OS")}</strong>
        <span>Anexada à OS</span>
      </div>
      <button class="danger" type="button" data-remove-invoice-image="${image.id}">Remover</button>
    `;
    els.invoiceImagePreview.appendChild(item);
  });
}

function render() {
  renderSelects();
  renderInvoices();
  renderClients();
  renderDashboard();
  renderSettings();
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
  const dialog = document.querySelector(`#${id}`);
  if (dialog?.showModal) {
    dialog.showModal();
  } else if (dialog) {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(id) {
  const dialog = document.querySelector(`#${id}`);
  if (dialog?.open && dialog.close) {
    dialog.close();
  } else if (dialog) {
    dialog.removeAttribute("open");
  }
}

function resetInvoiceForm(invoice = null) {
  document.querySelector("#invoiceModalTitle").textContent = invoice ? "Editar nota" : "Nova nota";
  document.querySelector("#invoiceId").value = invoice?.id || "";
  document.querySelector("#serviceOrder").value = invoice?.serviceOrder || "";
  document.querySelector("#fiscalNote").value = invoice?.fiscalNote || "";
  document.querySelector("#invoiceClient").value = invoice?.clientId || state.clients[0]?.id || "";
  document.querySelector("#plate").value = invoice?.plate || "";
  document.querySelector("#vehicleKm").value = invoice?.vehicleKm || "";
  document.querySelector("#amount").value = invoice ? String(invoice.amount).replace(".", ",") : "";
  document.querySelector("#paymentMethod").value = invoice?.paymentMethod || "PIX";
  document.querySelector("#installments").value = invoice?.installments || "";
  document.querySelector("#paidInstallments").value = invoice?.paidInstallments || "";
  updateInstallmentsVisibility();
  document.querySelector("#startDate").value = invoice?.startDate || new Date().toISOString().slice(0, 10);
  document.querySelector("#termDays").value = invoice?.termDays ?? "";
  document.querySelector("#paid").value = String(Boolean(invoice?.paid));
  document.querySelector("#paidDate").value = invoice?.paidDate || "";
  document.querySelector("#operationStatus").value = invoice?.operationStatus || "";
  currentInvoiceImages = Array.isArray(invoice?.images) ? [...invoice.images] : [];
  els.invoiceImages.value = "";
  renderInvoiceImagePreview();
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

function buildCompanyHeaderHtml(compact = false) {
  const settings = state.settings;
  const companyName = settings.companyName || "Empresa não configurada";
  const details = [
    settings.companyCnpj ? `CNPJ: ${settings.companyCnpj}` : "",
    settings.companyNumber ? `Número/telefone: ${settings.companyNumber}` : "",
  ].filter(Boolean);

  return `
    <header class="company-header ${compact ? "compact" : ""}">
      ${
        settings.companyLogo
          ? `<img class="company-logo" src="${escapeHtml(settings.companyLogo)}" alt="Logo da empresa" />`
          : `<div class="company-logo placeholder">LOGO</div>`
      }
      <div>
        <strong>${escapeHtml(companyName)}</strong>
        ${details.length ? `<span>${details.map(escapeHtml).join(" · ")}</span>` : `<span>Configure os dados da empresa no sistema.</span>`}
      </div>
    </header>
  `;
}

function exportRows() {
  return filteredInvoices()
    .slice()
    .sort(compareInvoices)
    .map((invoice) => {
      const client = getClient(invoice.clientId);
      const dueDate = addDays(invoice.startDate, invoice.termDays);
      return {
        invoice,
        client,
        dueDate,
        status: getInvoiceStatus(invoice),
      };
    });
}

function exportInvoicesPdf() {
  const rows = exportRows();
  if (!rows.length) {
    showToast("Não há notas para exportar.");
    return;
  }

  const total = rows.reduce((sum, item) => sum + Number(item.invoice.amount || 0), 0);
  const generatedAt = new Date().toLocaleString("pt-BR");
  const rowsHtml = rows
    .map(({ invoice, client, dueDate, status }) => {
      return `
        <tr>
          <td>${escapeHtml(invoice.serviceOrder)}</td>
          <td>${escapeHtml(invoice.fiscalNote || "-")}</td>
          <td>${escapeHtml(client?.name || "Cliente removido")}</td>
          <td>${escapeHtml(invoice.plate || "-")}</td>
          <td>${formatMoney(invoice.amount)}</td>
          <td>${escapeHtml(invoice.paymentMethod || "-")}</td>
          <td>${formatDate(invoice.startDate)}</td>
          <td>${dueDate ? formatDate(dueDate) : "-"}</td>
          <td>${statusLabel(status)}</td>
          <td>${escapeHtml(invoice.operationStatus || "-")}</td>
        </tr>
      `;
    })
    .join("");

  const html = buildPrintableDocument({
    title: "Relatório de notas",
    subtitle: `Gerado em ${generatedAt} · Total: ${formatMoney(total)}`,
    orientation: "landscape",
    content: `
      <div class="table-wrap-print">
        <table class="report-table">
        <thead>
          <tr>
            <th>OS</th>
            <th>Nota fiscal</th>
            <th>Cliente</th>
            <th>Placa</th>
            <th>Valor</th>
            <th>Pagamento</th>
            <th>Data inicial</th>
            <th>Prazo</th>
            <th>Situação</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `,
  });

  openPrintDocument(html);
  showToast("PDF aberto para impressão.");
}

function exportInvoicesExcel() {
  const rows = exportRows();
  if (!rows.length) {
    showToast("Não há notas para exportar.");
    return;
  }

  const settings = state.settings;
  const rowsHtml = rows
    .map(({ invoice, client, dueDate, status }) => {
      return `
        <tr>
          <td>${escapeHtml(invoice.serviceOrder)}</td>
          <td>${escapeHtml(invoice.fiscalNote || "")}</td>
          <td>${escapeHtml(client?.document || "")}</td>
          <td>${escapeHtml(client?.name || "Cliente removido")}</td>
          <td>${escapeHtml(invoice.plate || "")}</td>
          <td>${Number(invoice.amount || 0).toFixed(2)}</td>
          <td>${escapeHtml(invoice.paymentMethod || "")}</td>
          <td>${formatDate(invoice.startDate)}</td>
          <td>${dueDate ? formatDate(dueDate) : ""}</td>
          <td>${statusLabel(status)}</td>
          <td>${escapeHtml(invoice.operationStatus || "")}</td>
        </tr>
      `;
    })
    .join("");

  const workbook = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <tr><td colspan="11"><strong>${escapeHtml(settings.companyName || "Gestor NF")}</strong></td></tr>
          <tr><td colspan="11">${escapeHtml(settings.companyCnpj || "")} ${escapeHtml(settings.companyNumber || "")}</td></tr>
          <tr></tr>
          <tr>
            <th>OS</th>
            <th>Nota fiscal</th>
            <th>CPF/CNPJ</th>
            <th>Cliente</th>
            <th>Placa</th>
            <th>Valor</th>
            <th>Pagamento</th>
            <th>Data inicial</th>
            <th>Prazo</th>
            <th>Situação</th>
            <th>Status operacional</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
    </html>
  `;

  downloadFile(`gestor-nf-notas-${todaySlug()}.xls`, "\ufeff" + workbook, "application/vnd.ms-excel;charset=utf-8");
  showToast("Planilha Excel exportada.");
}

function formatKm(value) {
  if (value === "" || value === null || value === undefined) return "-";
  return `${Number(value || 0).toLocaleString("pt-BR")} km`;
}

function isInstallmentPayment(invoiceOrMethod) {
  const method = typeof invoiceOrMethod === "string" ? invoiceOrMethod : invoiceOrMethod?.paymentMethod;
  return normalize(method).includes("parcelado");
}

function updateInstallmentsVisibility() {
  const isParcelado = isInstallmentPayment(document.querySelector("#paymentMethod").value);
  els.installmentsLabel.hidden = !isParcelado;
  els.paidInstallmentsLabel.hidden = !isParcelado;
  if (!isParcelado) {
    els.installments.value = "";
    els.paidInstallments.value = "";
  }
}

function installmentLabel(invoice) {
  if (!isInstallmentPayment(invoice)) return "";
  const installments = Number(invoice.installments || 0);
  if (!installments) return "-";
  const paidInstallments = Math.min(Number(invoice.paidInstallments || 0), installments);
  const installmentValue = Number(invoice.amount || 0) / installments;
  const paidLabel = paidInstallments === 1 ? "1 PARCELA" : `${paidInstallments} PARCELAS`;
  return `${paidLabel} DE ${installments} PAGAS (${formatMoney(installmentValue)} cada)`;
}

function isPaymentComplete(invoice) {
  if (isInstallmentPayment(invoice)) {
    const installments = Number(invoice.installments || 0);
    return installments > 0 && Number(invoice.paidInstallments || 0) >= installments;
  }
  return Boolean(invoice.paid);
}

function paymentButtonLabel(invoice) {
  if (isInstallmentPayment(invoice)) {
    const installments = Number(invoice.installments || 0);
    const paidInstallments = Math.min(Number(invoice.paidInstallments || 0), installments);
    return paidInstallments > 0 ? `PAGO ${paidInstallments}/${installments || "?"}` : "Informar pag.";
  }
  return invoice.paid ? "PAGO" : "Informar pag.";
}

function informPayment(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  if (isInstallmentPayment(invoice)) {
    const installments = Number(invoice.installments || 0);
    if (!installments) {
      showToast("Informe a quantidade de parcelas desta OS.");
      return;
    }

    const nextInstallment = Math.min(Number(invoice.paidInstallments || 0) + 1, installments);
    invoice.paidInstallments = nextInstallment;
    invoice.paid = nextInstallment >= installments;
    invoice.paidDate = new Date().toISOString().slice(0, 10);
    showToast(`Pago parcela ${nextInstallment}/${installments}.`);
  } else {
    if (invoice.paid) {
      showToast("Esta OS já está marcada como paga.");
      return;
    }
    invoice.paid = true;
    invoice.paidDate = new Date().toISOString().slice(0, 10);
    invoice.paidInstallments = 0;
    showToast("Pagamento informado.");
  }

  saveData();
  render();
  if (els.invoiceSummaryModal.open && currentSummaryInvoiceId === invoiceId) {
    closeDialog("invoiceSummaryModal");
    openInvoiceSummary(invoiceId);
  }
}

function buildImageGallery(images, emptyText = "Nenhuma imagem anexada.") {
  const safeImages = Array.isArray(images) ? images : [];
  if (!safeImages.length) {
    return `<div class="summary-empty">${escapeHtml(emptyText)}</div>`;
  }

  return `
    <div class="summary-image-grid">
      ${safeImages
        .map(
          (image) => `
            <figure>
              <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
              <figcaption>${escapeHtml(image.name || "Imagem da OS")}</figcaption>
            </figure>
          `,
        )
        .join("")}
    </div>
  `;
}

function buildPrintImageGallery(images) {
  const safeImages = Array.isArray(images) ? images : [];
  if (!safeImages.length) return "";

  return `
    <section class="print-images">
      <h2>Imagens anexadas</h2>
      <div class="print-image-grid">
        ${safeImages
          .map(
            (image) => `
              <figure>
                <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || "Imagem da OS")}" />
                <figcaption>${escapeHtml(image.name || "Imagem da OS")}</figcaption>
              </figure>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function openInvoiceSummary(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  const client = getClient(invoice.clientId);
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  const status = getInvoiceStatus(invoice);
  const images = invoice.images || [];
  const installmentsRow = isInstallmentPayment(invoice)
    ? `<div><dt>Parcelas</dt><dd>${installmentLabel(invoice)}</dd></div>`
    : "";
  const paidLabel = isInstallmentPayment(invoice) ? installmentLabel(invoice) : invoice.paid ? "Sim" : "Não";
  currentSummaryInvoiceId = invoice.id;
  els.invoiceSummaryTitle.textContent = `Resumo da OS ${invoice.serviceOrder}`;
  els.invoiceSummaryContent.innerHTML = `
    <section class="summary-hero">
      <div>
        <span>OS</span>
        <strong>${escapeHtml(invoice.serviceOrder)}</strong>
      </div>
      <div>
        <span>Valor</span>
        <strong>${formatMoney(invoice.amount)}</strong>
      </div>
      <div>
        <span>Situação</span>
        <strong>${statusLabel(status)}</strong>
      </div>
      <div>
        <span>Imagens</span>
        <strong>${images.length}</strong>
      </div>
    </section>

    <section class="summary-grid">
      <article>
        <h3>Cliente</h3>
        <dl>
          <div><dt>Nome</dt><dd>${escapeHtml(client?.name || "Cliente removido")}</dd></div>
          <div><dt>CPF/CNPJ</dt><dd>${escapeHtml(client?.document || "-")}</dd></div>
          <div><dt>Telefone</dt><dd>${escapeHtml(client?.phone || "-")}</dd></div>
        </dl>
      </article>
      <article>
        <h3>Veículo e serviço</h3>
        <dl>
          <div><dt>Placa</dt><dd>${escapeHtml(invoice.plate || "-")}</dd></div>
          <div><dt>KM</dt><dd>${formatKm(invoice.vehicleKm)}</dd></div>
          <div><dt>Nota fiscal</dt><dd>${escapeHtml(invoice.fiscalNote || "-")}</dd></div>
          <div><dt>Status</dt><dd>${escapeHtml(invoice.operationStatus || "-")}</dd></div>
        </dl>
      </article>
      <article>
        <h3>Pagamento</h3>
        <dl>
          <div><dt>Valor total</dt><dd>${formatMoney(invoice.amount)}</dd></div>
          <div><dt>Forma</dt><dd>${escapeHtml(invoice.paymentMethod || "-")}</dd></div>
          ${installmentsRow}
          <div><dt>Pago?</dt><dd>${paidLabel}</dd></div>
        </dl>
      </article>
      <article>
        <h3>Prazo</h3>
        <dl>
          <div><dt>Data inicial</dt><dd>${formatDate(invoice.startDate)}</dd></div>
          <div><dt>Data limite</dt><dd>${dueDate ? formatDate(dueDate) : "-"}</dd></div>
          <div><dt>Dias</dt><dd>${getDueDays(invoice)}</dd></div>
          <div><dt>Data de pagamento</dt><dd>${formatDate(invoice.paidDate)}</dd></div>
        </dl>
      </article>
    </section>

    <section class="summary-notes">
      <h3>Resumo do que foi feito</h3>
      <p>${escapeHtml(invoice.operationStatus || "Sem observações registradas.")}</p>
    </section>

    <section class="summary-images">
      <h3>Imagens anexadas</h3>
      ${buildImageGallery(images)}
    </section>
  `;
  openDialog("invoiceSummaryModal");
}

function printServiceOrder(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  const client = getClient(invoice.clientId);
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  const status = getInvoiceStatus(invoice);
  const printInstallmentsField = isInstallmentPayment(invoice)
    ? `
            <div class="field-item highlight-field">
              <span>Parcelas</span>
              <strong>${installmentLabel(invoice)}</strong>
            </div>
      `
    : "";
  const printPaidLabel = isInstallmentPayment(invoice) ? installmentLabel(invoice) : invoice.paid ? "Sim" : "Não";
  const clientAddress = [
    client?.address,
    client?.number ? `Nº ${client.number}` : "",
    client?.district,
    client?.city,
    client?.state,
    client?.zip ? `CEP ${client.zip}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const html = buildPrintableDocument({
    title: `Ordem de serviço ${invoice.serviceOrder}`,
    subtitle: `Emitida em ${new Date().toLocaleDateString("pt-BR")}`,
    orientation: "portrait",
    content: `
      <section class="os-summary">
        <div class="summary-block summary-primary">
          <span>OS</span>
          <strong>${escapeHtml(invoice.serviceOrder)}</strong>
        </div>
        <div class="summary-block">
          <span>Nota fiscal</span>
          <strong>${escapeHtml(invoice.fiscalNote || "-")}</strong>
        </div>
        <div class="summary-block">
          <span>Placa</span>
          <strong>${escapeHtml(invoice.plate || "-")}</strong>
        </div>
        <div class="summary-block">
          <span>Situação</span>
          <strong class="status-text status-text-${status}">${statusLabel(status)}</strong>
        </div>
      </section>

      <section class="section-title">Dados principais</section>
      <section class="detail-grid">
        <article class="detail-card wide">
          <h2>Cliente</h2>
          <div class="field-list">
            <div>
              <span>Nome</span>
              <strong>${escapeHtml(client?.name || "Cliente removido")}</strong>
            </div>
            <div>
              <span>CPF/CNPJ</span>
              <strong>${escapeHtml(client?.document || "-")}</strong>
            </div>
            <div>
              <span>Endereço</span>
              <strong>${escapeHtml(clientAddress || "-")}</strong>
            </div>
            <div>
              <span>Telefone</span>
              <strong>${escapeHtml(client?.phone || "-")}</strong>
            </div>
          </div>
        </article>
        <article class="detail-card">
          <h2>Serviço</h2>
          <div class="field-list">
            <div>
              <span>Status operacional</span>
              <strong>${escapeHtml(invoice.operationStatus || "-")}</strong>
            </div>
            <div>
              <span>KM do veículo</span>
              <strong>${formatKm(invoice.vehicleKm)}</strong>
            </div>
            <div>
              <span>Data inicial</span>
              <strong>${formatDate(invoice.startDate)}</strong>
            </div>
            <div>
              <span>Prazo em dias</span>
              <strong>${invoice.termDays === "" ? "-" : invoice.termDays}</strong>
            </div>
            <div>
              <span>Data limite</span>
              <strong>${dueDate ? formatDate(dueDate) : "-"}</strong>
            </div>
          </div>
        </article>
        <article class="detail-card">
          <h2>Pagamento</h2>
          <div class="field-list">
            <div>
              <span>Valor</span>
              <strong class="money-value">${formatMoney(invoice.amount)}</strong>
            </div>
            <div>
              <span>Forma</span>
              <strong>${escapeHtml(invoice.paymentMethod || "-")}</strong>
            </div>
            ${printInstallmentsField}
            <div>
              <span>Pago?</span>
              <strong>${printPaidLabel}</strong>
            </div>
            <div>
              <span>Data de pagamento</span>
              <strong>${formatDate(invoice.paidDate)}</strong>
            </div>
          </div>
        </article>
      </section>
      <section class="notes-box">
        <h2>Observações operacionais</h2>
        <p>${escapeHtml(invoice.operationStatus || "Sem observações registradas.")}</p>
      </section>
      ${buildPrintImageGallery(invoice.images)}
      <section class="signature-grid">
        <div><span></span><strong>Responsável pela OS</strong></div>
        <div><span></span><strong>Assinatura do cliente</strong></div>
      </section>
    `,
  });

  openPrintDocument(html);
  showToast("OS aberta para impressão.");
}

function buildPrintableDocument({ title, subtitle, orientation, content }) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 ${orientation};
            margin: ${orientation === "portrait" ? "18mm 16mm 18mm 16mm" : "15mm 12mm 15mm 12mm"};
          }
          html {
            background: #eef2f7;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 18px;
            color: #101828;
            background: #eef2f7;
            font-family: Arial, "Segoe UI", sans-serif;
            font-size: 12px;
            line-height: 1.4;
            width: 100%;
          }
          .document-page {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: ${orientation === "portrait" ? "18px" : "14px"};
            border: 1px solid #d8e1ee;
            border-radius: 10px;
            background: #ffffff;
            box-shadow: 0 16px 40px rgba(16, 24, 40, 0.12);
          }
          .company-header {
            display: flex;
            gap: 20px;
            align-items: center;
            padding: 14px 16px;
            border: 1px solid #b8c7dc;
            border-left: 10px solid #1c315f;
            border-radius: 12px;
            background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
            width: 100%;
          }
          .company-logo {
            display: flex;
            width: 110px;
            height: 75px;
            justify-content: center;
            align-items: center;
            object-fit: contain;
            padding: 6px;
            border: 1px solid #b8c7dc;
            border-radius: 10px;
            color: #687386;
            background: #ffffff;
            font-weight: 700;
            flex-shrink: 0;
          }
          .company-logo.placeholder {
            background: #eef2f7;
          }
          .company-header > div {
            flex-grow: 1;
          }
          .company-header strong {
            display: block;
            color: #111827;
            font-size: 20px;
            line-height: 1.15;
            text-transform: uppercase;
          }
          .company-header span {
            display: block;
            margin-top: 6px;
            color: #475467;
            font-size: 11px;
          }
          .document-title {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin: 14px 0 12px;
            padding: 12px 14px;
            border-radius: 12px;
            color: #ffffff;
            background: #1c315f;
            width: 100%;
          }
          h1 {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            line-height: 1.1;
            text-transform: uppercase;
          }
          .subtitle {
            margin: 4px 0 0;
            color: rgba(255, 255, 255, 0.78);
            font-size: 12px;
          }
          .table-wrap-print {
            width: 100%;
            overflow: visible;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            table-layout: fixed; /* Força o texto a quebrar sem expandir a tabela */
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          th,
          td {
            padding: 7px 8px;
            border: 1px solid #d7dee8;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
            line-height: 1.3;
            overflow-wrap: anywhere;
            word-break: normal;
            word-wrap: break-word;
            white-space: normal; /* Garante que os textos quebrem linha na tabela */
          }
          th {
            color: #ffffff;
            background: #1c315f;
            font-size: 10.5px;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          td {
            color: #1f2937;
          }
          .report-table th:nth-child(1),
          .report-table td:nth-child(1) {
            width: 8%;
          }
          .report-table th:nth-child(2),
          .report-table td:nth-child(2),
          .report-table th:nth-child(4),
          .report-table td:nth-child(4) {
            width: 10%;
          }
          .report-table th:nth-child(3),
          .report-table td:nth-child(3) {
            width: 22%;
          }
          .report-table th:nth-child(5),
          .report-table td:nth-child(5),
          .report-table th:nth-child(6),
          .report-table td:nth-child(6),
          .report-table th:nth-child(7),
          .report-table td:nth-child(7),
          .report-table th:nth-child(8),
          .report-table td:nth-child(8) {
            width: 10%;
          }
          .report-table th:nth-child(9),
          .report-table td:nth-child(9) {
            width: 9%;
          }
          .report-table th:nth-child(10),
          .report-table td:nth-child(10) {
            width: 11%;
          }
          .os-summary {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
            width: 100%;
          }
          .summary-block {
            flex: 1;
            min-width: 0; /* Impede que caixas estiquem o flexbox */
            min-height: 70px;
            padding: 10px 12px;
            border: 1px solid #b8c7dc;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 8px 20px rgba(16, 24, 40, 0.08);
          }
          .summary-primary {
            color: #ffffff;
            border-color: #1c315f;
            background: #1c315f;
          }
          .summary-block span,
          .field-list span {
            display: block;
            color: #667085;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .summary-primary span {
            color: rgba(255, 255, 255, 0.72);
          }
          .summary-block strong {
            display: block;
            margin-top: 6px;
            color: #111827;
            font-size: 18px;
            line-height: 1.1;
            word-break: break-word;
          }
          .summary-primary strong {
            color: #ffffff;
            font-size: 24px;
          }
          .status-text {
            display: inline-block;
            width: fit-content;
            padding: 2px 6px;
            border-radius: 999px;
            font-size: 12px !important;
          }
          .status-text-pago {
            color: #027a48 !important;
            background: #ecfdf3;
          }
          .status-text-vencido {
            color: #b42318 !important;
            background: #fff0ee;
          }
          .status-text-no-prazo {
            color: #8a5a00 !important;
            background: #fff7df;
          }
          .section-title {
            margin: 10px 0 8px;
            padding: 6px 10px;
            border-left: 6px solid #1c315f;
            border-radius: 8px;
            color: #1c315f;
            background: #eef4ff;
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            width: 100%;
          }
          .detail-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 10px;
            width: 100%;
          }
          .detail-card,
          .notes-box {
            width: 100%;
            padding: 12px;
            border: 1px solid #b8c7dc;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h2 {
            margin: 0 0 10px;
            color: #1c315f;
            font-size: 13px;
            text-transform: uppercase;
          }
          p {
            margin: 0 0 6px;
          }
          .field-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            width: 100%;
          }
          .field-list div {
            padding: 8px 10px;
            border: 1px solid #dbe4ef;
            border-radius: 8px;
            background: #f8fbff;
            min-height: 45px;
          }
          .field-list div.highlight-field {
            border-color: #b6cdf6;
            background: #eef4ff;
          }
          .field-list strong {
            display: block;
            margin-top: 4px;
            color: #111827;
            font-size: 12px;
            line-height: 1.3;
            word-break: break-word;
          }
          .money-value {
            color: #027a48 !important;
            font-size: 15px !important;
          }
          .notes-box {
            margin-top: 10px;
          }
          .notes-box p {
            padding: 10px;
            border: 1px solid #dbe4ef;
            border-radius: 8px;
            background: #f8fbff;
            color: #1f2937;
            font-size: 12px;
          }
          .print-images {
            margin-top: 10px;
            padding: 12px;
            border: 1px solid #b8c7dc;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
            page-break-inside: avoid;
            width: 100%;
          }
          .print-image-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            width: 100%;
          }
          .print-image-grid figure {
            margin: 0;
            padding: 8px;
            border: 1px solid #dbe4ef;
            border-radius: 10px;
            background: #f8fbff;
            page-break-inside: avoid;
          }
          .print-image-grid img {
            display: block;
            width: 100%;
            max-height: 200px;
            object-fit: contain;
            border: 1px solid #eef2f7;
            border-radius: 8px;
            background: #ffffff;
          }
          .print-image-grid figcaption {
            margin-top: 6px;
            color: #475467;
            font-size: 10px;
            text-align: center;
          }
          .signature-grid {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            margin-top: 40px;
            width: 100%;
            page-break-inside: avoid;
          }
          .signature-grid > div {
            flex: 1;
          }
          .signature-grid span {
            display: block;
            height: 24px;
            border-bottom: 1px solid #172033;
          }
          .signature-grid strong {
            display: block;
            margin-top: 6px;
            color: #344054;
            font-size: 11px;
            text-align: center;
            text-transform: uppercase;
          }
          .print-actions {
            position: fixed;
            right: 16px;
            bottom: 16px;
          }
          .print-actions button {
            min-height: 40px;
            padding: 10px 14px;
            border: 0;
            border-radius: 6px;
            color: #ffffff;
            background: #2563eb;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }
          @media print {
            html,
            body {
              background: #ffffff;
            }
            body {
              padding: 0;
            }
            .document-page {
              padding: 0;
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }
            .company-header,
            .document-title,
            .summary-block,
            .detail-card,
            .notes-box,
            .print-images {
              box-shadow: none;
            }
            .print-actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <main class="document-page">
          ${buildCompanyHeaderHtml(true)}
          <section class="document-title">
            <div>
              <h1>${escapeHtml(title)}</h1>
              <p class="subtitle">${escapeHtml(subtitle)}</p>
            </div>
          </section>
          ${content}
        </main>
        <div class="print-actions">
          <button type="button" onclick="window.print()">Imprimir / salvar PDF</button>
        </div>
      </body>
    </html>
  `;
}

function openPrintDocument(html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    URL.revokeObjectURL(url);
    showToast("Permita pop-ups para abrir o PDF.");
    return;
  }

  printWindow.focus();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function todaySlug() {
  return new Date().toISOString().slice(0, 10);
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = dataUrl;
  });
}

async function prepareInvoiceImage(file) {
  const dataUrl = await readImageAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, INVOICE_IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return {
    id: makeId(),
    name: file.name,
    dataUrl: canvas.toDataURL("image/jpeg", 0.86),
  };
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
  const id = document.querySelector("#invoiceId").value || makeId();
  const existingInvoice = state.invoices.find((item) => item.id === id);
  const invoice = {
    id,
    serviceOrder: document.querySelector("#serviceOrder").value.trim(),
    fiscalNote: document.querySelector("#fiscalNote").value.trim().toUpperCase(),
    clientId: document.querySelector("#invoiceClient").value,
    plate: document.querySelector("#plate").value.trim().toUpperCase(),
    vehicleKm: document.querySelector("#vehicleKm").value === "" ? "" : Number(document.querySelector("#vehicleKm").value),
    amount: parseMoney(document.querySelector("#amount").value),
    paymentMethod: document.querySelector("#paymentMethod").value,
    installments: isInstallmentPayment(document.querySelector("#paymentMethod").value)
      ? document.querySelector("#installments").value === ""
        ? ""
        : Number(document.querySelector("#installments").value)
      : "",
    startDate: document.querySelector("#startDate").value,
    termDays: document.querySelector("#termDays").value === "" ? "" : Number(document.querySelector("#termDays").value),
    paid: document.querySelector("#paid").value === "true",
    paidDate: document.querySelector("#paidDate").value,
    operationStatus: document.querySelector("#operationStatus").value.trim().toUpperCase(),
    images: currentInvoiceImages,
  };

  if (isInstallmentPayment(invoice)) {
    const installments = Number(invoice.installments || 0);
    const typedPaidInstallments = document.querySelector("#paidInstallments").value === ""
      ? Number(existingInvoice?.paidInstallments || 0)
      : Number(document.querySelector("#paidInstallments").value);
    invoice.paidInstallments = Math.min(Math.max(typedPaidInstallments, 0), installments || 0);
    invoice.paid = installments > 0 && invoice.paidInstallments >= installments;
    if (invoice.paidInstallments > 0 && !invoice.paidDate) {
      invoice.paidDate = new Date().toISOString().slice(0, 10);
    }
  } else {
    invoice.paidInstallments = 0;
  }

  try {
    await saveInvoice(invoice);
    closeDialog("invoiceModal");
    showToast("Nota salva com sucesso.");
  } catch {
    showToast("Não foi possível salvar a nota.");
  }
});

document.querySelector("#clientForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#clientId").value || makeId();
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
    showToast("Não foi possível salvar o cliente.");
  }
});

els.companyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    ...state.settings,
    companyName: els.companyName.value.trim(),
    companyCnpj: els.companyCnpj.value.trim(),
    companyNumber: els.companyNumber.value.trim(),
  };
  saveData();
  renderSettings();
  showToast("Configurações salvas.");
});

els.companyLogo.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Escolha uma imagem para a logo.");
    event.target.value = "";
    return;
  }

  if (file.size > MAX_LOGO_SIZE) {
    showToast("Use uma imagem com até 2 MB.");
    event.target.value = "";
    return;
  }

  try {
    state.settings.companyLogo = await readImageAsDataUrl(file);
    saveData();
    renderSettings();
    showToast("Logo carregada.");
  } catch {
    showToast("Não foi possível carregar a imagem.");
  }
});

els.invoiceImages.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const availableSlots = MAX_INVOICE_IMAGES - currentInvoiceImages.length;
  if (availableSlots <= 0) {
    showToast(`Limite de ${MAX_INVOICE_IMAGES} imagens por OS.`);
    event.target.value = "";
    return;
  }

  const acceptedFiles = files.slice(0, availableSlots);
  try {
    let addedCount = 0;
    for (const file of acceptedFiles) {
      if (!file.type.startsWith("image/")) {
        showToast("Escolha apenas arquivos de imagem.");
        continue;
      }
      if (file.size > MAX_INVOICE_IMAGE_SIZE) {
        showToast(`Imagem muito grande: ${file.name}. Use até 3 MB.`);
        continue;
      }
      currentInvoiceImages.push(await prepareInvoiceImage(file));
      addedCount += 1;
    }

    if (files.length > acceptedFiles.length) {
      showToast(`Foram anexadas ${addedCount} imagens. Limite: ${MAX_INVOICE_IMAGES}.`);
    } else if (addedCount > 0) {
      showToast("Imagem anexada à OS.");
    }
    renderInvoiceImagePreview();
  } catch {
    showToast("Não foi possível anexar uma das imagens.");
  } finally {
    event.target.value = "";
  }
});

els.removeLogo.addEventListener("click", () => {
  state.settings.companyLogo = "";
  saveData();
  renderSettings();
  showToast("Logo removida.");
});

document.body.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (button) {
    const editInvoiceId = button.dataset.editInvoice;
    const deleteInvoiceId = button.dataset.deleteInvoice;
    const editClientId = button.dataset.editClient;
    const deleteClientId = button.dataset.deleteClient;
    const printOsId = button.dataset.printOs;
    const viewInvoiceId = button.dataset.viewInvoice;
    const removeInvoiceImageId = button.dataset.removeInvoiceImage;
    const informPaymentId = button.dataset.informPayment;
    const exportFormat = button.dataset.exportFormat;

    if (exportFormat) {
      closeDialog("exportModal");
      if (exportFormat === "pdf") exportInvoicesPdf();
      if (exportFormat === "excel") exportInvoicesExcel();
      return;
    }

    if (removeInvoiceImageId) {
      currentInvoiceImages = currentInvoiceImages.filter((image) => image.id !== removeInvoiceImageId);
      renderInvoiceImagePreview();
      return;
    }

    if (viewInvoiceId) {
      openInvoiceSummary(viewInvoiceId);
      return;
    }

    if (informPaymentId) {
      informPayment(informPaymentId);
      return;
    }

    if (printOsId) {
      printServiceOrder(printOsId);
      return;
    }

    if (editInvoiceId) {
      const invoice = state.invoices.find((item) => item.id === editInvoiceId);
      resetInvoiceForm(invoice);
      openDialog("invoiceModal");
      return;
    }

    if (deleteInvoiceId && confirm("Excluir esta nota?")) {
      try {
        await removeInvoice(deleteInvoiceId);
        showToast("Nota excluida.");
      } catch {
        showToast("Nao foi possivel excluir a nota.");
      }
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
      return;
    }

    return;
  }

  const rowInvoiceId = event.target.closest("[data-view-invoice-row]")?.dataset.viewInvoiceRow;
  if (rowInvoiceId) openInvoiceSummary(rowInvoiceId);
});

document.querySelector("#paid").addEventListener("change", (event) => {
  const paidDate = document.querySelector("#paidDate");
  if (event.target.value === "true" && !paidDate.value) {
    paidDate.value = new Date().toISOString().slice(0, 10);
  }
});

document.querySelector("#paymentMethod").addEventListener("change", updateInstallmentsVisibility);

els.summaryPrintInvoice.addEventListener("click", () => {
  if (currentSummaryInvoiceId) printServiceOrder(currentSummaryInvoiceId);
});

els.summaryEditInvoice.addEventListener("click", () => {
  const invoice = state.invoices.find((item) => item.id === currentSummaryInvoiceId);
  if (!invoice) return;
  closeDialog("invoiceSummaryModal");
  resetInvoiceForm(invoice);
  openDialog("invoiceModal");
});

document.querySelector("#exportData").addEventListener("click", () => {
  openDialog("exportModal");
});

document.querySelector("#importData").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.clients) || !Array.isArray(imported.invoices)) {
      throw new Error("Formato invalido");
    }

    state = normalizeState({
      clients: imported.clients,
      invoices: imported.invoices,
      settings: imported.settings || state.settings,
    });
    saveData();
    render();
    showToast("Dados importados com sucesso.");
  } catch {
    showToast("Não foi possível importar esse arquivo.");
  } finally {
    event.target.value = "";
  }
});

render();
