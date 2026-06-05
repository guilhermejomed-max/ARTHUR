const STORAGE_KEY = "gestor-nf-data-v1";
const BACKUP_STORAGE_KEY = "gestor-nf-data-v1-backup";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

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
    amount,
    paymentMethod,
    startDate,
    termDays: termDays === "" ? "" : Number(termDays),
    paid,
    paidDate,
    operationStatus,
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
  return {
    fiscalNote: "",
    ...invoice,
  };
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
      `${invoice.serviceOrder} ${invoice.fiscalNote} ${client?.name} ${invoice.plate} ${invoice.operationStatus} ${invoice.paymentMethod}`,
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
      row.innerHTML = `
        <td>${escapeHtml(invoice.serviceOrder)}</td>
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
            <button class="ghost" type="button" data-print-os="${invoice.id}">OS</button>
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
      <table>
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

function printServiceOrder(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  const client = getClient(invoice.clientId);
  const dueDate = addDays(invoice.startDate, invoice.termDays);
  const status = getInvoiceStatus(invoice);
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
      <section class="info-grid">
        <article>
          <h2>Cliente</h2>
          <p><strong>${escapeHtml(client?.name || "Cliente removido")}</strong></p>
          <p>${escapeHtml(client?.document || "-")}</p>
          <p>${escapeHtml(clientAddress || "-")}</p>
          <p>${escapeHtml(client?.phone || "-")}</p>
        </article>
        <article>
          <h2>Dados da OS</h2>
          <p><strong>OS:</strong> ${escapeHtml(invoice.serviceOrder)}</p>
          <p><strong>Nota fiscal:</strong> ${escapeHtml(invoice.fiscalNote || "-")}</p>
          <p><strong>Placa:</strong> ${escapeHtml(invoice.plate || "-")}</p>
          <p><strong>Status:</strong> ${escapeHtml(invoice.operationStatus || "-")}</p>
          <p><strong>Situação:</strong> ${statusLabel(status)}</p>
        </article>
      </section>
      <section class="info-grid">
        <article>
          <h2>Pagamento</h2>
          <p><strong>Valor:</strong> ${formatMoney(invoice.amount)}</p>
          <p><strong>Forma:</strong> ${escapeHtml(invoice.paymentMethod || "-")}</p>
          <p><strong>Pago:</strong> ${invoice.paid ? "Sim" : "Não"}</p>
          <p><strong>Data de pagamento:</strong> ${formatDate(invoice.paidDate)}</p>
        </article>
        <article>
          <h2>Prazo</h2>
          <p><strong>Data inicial:</strong> ${formatDate(invoice.startDate)}</p>
          <p><strong>Prazo em dias:</strong> ${invoice.termDays === "" ? "-" : invoice.termDays}</p>
          <p><strong>Data limite:</strong> ${dueDate ? formatDate(dueDate) : "-"}</p>
          <p><strong>Dias restantes:</strong> ${getDueDays(invoice)}</p>
        </article>
      </section>
      <section class="notes-box">
        <h2>Observações</h2>
        <p>${escapeHtml(invoice.operationStatus || "Sem observações registradas.")}</p>
      </section>
      <section class="signature-grid">
        <div><span></span><strong>Responsável</strong></div>
        <div><span></span><strong>Cliente</strong></div>
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
          @page { size: A4 ${orientation}; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #162033;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }
          .company-header {
            display: grid;
            grid-template-columns: 96px 1fr;
            gap: 16px;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 2px solid #1c315f;
          }
          .company-logo {
            display: grid;
            width: 96px;
            height: 72px;
            place-items: center;
            object-fit: contain;
            border: 1px solid #dfe4ec;
            border-radius: 6px;
            color: #687386;
            font-weight: 700;
          }
          .company-logo.placeholder {
            background: #f4f6f9;
          }
          .company-header strong {
            display: block;
            font-size: 20px;
            text-transform: uppercase;
          }
          .company-header span {
            display: block;
            margin-top: 6px;
            color: #596579;
          }
          .document-title {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin: 18px 0 14px;
          }
          h1 {
            margin: 0;
            color: #1c315f;
            font-size: 22px;
            text-transform: uppercase;
          }
          .subtitle {
            margin: 4px 0 0;
            color: #596579;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            padding: 8px;
            border: 1px solid #dfe4ec;
            text-align: left;
            vertical-align: top;
          }
          th {
            color: #ffffff;
            background: #1c315f;
            font-size: 11px;
            text-transform: uppercase;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          article,
          .notes-box {
            min-height: 118px;
            padding: 12px;
            border: 1px solid #dfe4ec;
            border-radius: 6px;
          }
          h2 {
            margin: 0 0 10px;
            color: #1c315f;
            font-size: 13px;
            text-transform: uppercase;
          }
          p {
            margin: 0 0 7px;
          }
          .notes-box {
            min-height: 110px;
            margin-top: 4px;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 42px;
            margin-top: 48px;
          }
          .signature-grid span {
            display: block;
            border-top: 1px solid #172033;
          }
          .signature-grid strong {
            display: block;
            margin-top: 8px;
            text-align: center;
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
            .print-actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${buildCompanyHeaderHtml()}
        <section class="document-title">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="subtitle">${escapeHtml(subtitle)}</p>
          </div>
        </section>
        ${content}
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
  const invoice = {
    id,
    serviceOrder: document.querySelector("#serviceOrder").value.trim(),
    fiscalNote: document.querySelector("#fiscalNote").value.trim().toUpperCase(),
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

els.removeLogo.addEventListener("click", () => {
  state.settings.companyLogo = "";
  saveData();
  renderSettings();
  showToast("Logo removida.");
});

document.body.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const editInvoiceId = button.dataset.editInvoice;
  const deleteInvoiceId = button.dataset.deleteInvoice;
  const editClientId = button.dataset.editClient;
  const deleteClientId = button.dataset.deleteClient;
  const printOsId = button.dataset.printOs;
  const exportFormat = button.dataset.exportFormat;

  if (exportFormat) {
    closeDialog("exportModal");
    if (exportFormat === "pdf") exportInvoicesPdf();
    if (exportFormat === "excel") exportInvoicesExcel();
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
  }

  if (deleteInvoiceId && confirm("Excluir esta nota?")) {
    try {
      await removeInvoice(deleteInvoiceId);
      showToast("Nota excluída.");
    } catch {
      showToast("Não foi possível excluir a nota.");
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
        showToast("Cliente excluído.");
      } catch {
        showToast("Não foi possível excluir o cliente.");
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
