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
      address: "AVENIDA PAPA JOAO PAULO I",
      number: "2201",
      zip: "07170-350",
      district: "RESIDENCIAL BAMBI",
      city: "GUARULHOS",
      state: "SP",
      phone: "(11) 2436-4100",
    }
  ],
  invoices: [],
  settings: { ...defaultSettings }
};

let state = {
  clients: [],
  invoices: [],
  settings: { ...defaultSettings }
};

let currentInvoiceImages = [];
let activeFilters = { search: "", status: "todos" };
let currentSummaryInvoiceId = null;

const els = {
  views: document.querySelectorAll(".view-content"),
  navButtons: document.querySelectorAll(".nav-item"),
  clientTable: document.querySelector("#clientTableBody"),
  invoiceTable: document.querySelector("#invoiceTableBody"),
  clientSelect: document.querySelector("#invoiceClient"),
  storageCount: document.querySelector("#storageCount"),
  searchInput: document.querySelector("#searchInvoice"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  
  statsTotal: document.querySelector("#statTotal"),
  statsPago: document.querySelector("#statPago"),
  statsPendente: document.querySelector("#statPendente"),
  
  summaryClientName: document.querySelector("#summaryClientName"),
  summaryClientDoc: document.querySelector("#summaryClientDoc"),
  summaryClientPhone: document.querySelector("#summaryClientPhone"),
  summaryClientAddress: document.querySelector("#summaryClientAddress"),
  summaryId: document.querySelector("#summaryId"),
  summaryStatus: document.querySelector("#summaryStatus"),
  summaryIssueDate: document.querySelector("#summaryIssueDate"),
  summaryDueDate: document.querySelector("#summaryDueDate"),
  summaryPaidDate: document.querySelector("#summaryPaidDate"),
  summaryValue: document.querySelector("#summaryValue"),
  summaryPaymentMethod: document.querySelector("#summaryPaymentMethod"),
  summaryInstallments: document.querySelector("#summaryInstallments"),
  summaryVehicle: document.querySelector("#summaryVehicle"),
  summaryKm: document.querySelector("#summaryKm"),
  summaryDescription: document.querySelector("#summaryDescription"),
  summaryObservations: document.querySelector("#summaryObservations"),
  summaryImages: document.querySelector("#summaryImages"),
  summaryPrintInvoice: document.querySelector("#summaryPrintInvoice"),
  summaryEditInvoice: document.querySelector("#summaryEditInvoice"),
  
  settingsName: document.querySelector("#settingsName"),
  settingsCnpj: document.querySelector("#settingsCnpj"),
  settingsNumber: document.querySelector("#settingsNumber"),
  settingsLogo: document.querySelector("#settingsLogo"),
  settingsLogoPreview: document.querySelector("#settingsLogoPreview"),
  settingsRemoveLogo: document.querySelector("#settingsRemoveLogo"),
};

function init() {
  setupNavigation();
  setupModals();
  setupForms();
  setupSettings();
  loadState();
  render();
}

function makeId() {
  return "id-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupNavigation() {
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewName = btn.getAttribute("data-view");
      
      els.navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      els.views.forEach((v) => {
        if (v.id === viewName + "View") {
          v.classList.add("active");
        } else {
          v.classList.remove("active");
        }
      });
    });
  });
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.close();
}

function setupModals() {
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-open");
      if (modalId === "invoiceModal") resetInvoiceForm();
      if (modalId === "clientModal") resetClientForm();
      openDialog(modalId);
    });
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeDialog(btn.getAttribute("data-close"));
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state = normalizeState(seedData);
      saveState();
      return;
    }
    state = normalizeState(JSON.parse(raw));
  } catch (err) {
    console.error("Erro ao carregar dados, redefinindo...", err);
    state = normalizeState(seedData);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    showToast("Erro ao salvar dados localmente.");
  }
}

function normalizeState(raw) {
  const data = raw || {};
  return {
    clients: Array.isArray(data.clients) ? data.clients : [],
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
    settings: data.settings && typeof data.settings === "object" ? { ...defaultSettings, ...data.settings } : { ...defaultSettings },
  };
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function render() {
  renderSettings();
  renderClients();
  renderInvoices();
  renderDashboard();
  els.storageCount.textContent = `${state.clients.length + state.invoices.length} registros`;
}

function renderSettings() {
  els.settingsName.value = state.settings.companyName || "";
  els.settingsCnpj.value = state.settings.companyCnpj || "";
  els.settingsNumber.value = state.settings.companyNumber || "";
  
  if (state.settings.companyLogo) {
    els.settingsLogoPreview.src = state.settings.companyLogo;
    els.settingsLogoPreview.style.display = "block";
    els.settingsRemoveLogo.style.display = "inline-flex";
  } else {
    els.settingsLogoPreview.src = "";
    els.settingsLogoPreview.style.display = "none";
    els.settingsRemoveLogo.style.display = "none";
  }
}

function setupSettings() {
  const form = document.querySelector("#settingsForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.settings.companyName = els.settingsName.value.trim();
    state.settings.companyCnpj = els.settingsCnpj.value.trim();
    state.settings.companyNumber = els.settingsNumber.value.trim();
    saveState();
    showToast("Configurações salvas com sucesso!");
    render();
  });

  els.settingsLogo.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      showToast("A imagem do logo deve ter no máximo 2MB.");
      els.settingsLogo.value = "";
      return;
    }
    try {
      const base64 = await resizeAndConvertToBase64(file, 500);
      state.settings.companyLogo = base64;
      els.settingsLogoPreview.src = base64;
      els.settingsLogoPreview.style.display = "block";
      els.settingsRemoveLogo.style.display = "inline-flex";
    } catch (err) {
      showToast("Erro ao processar imagem da logo.");
    }
  });

  els.settingsRemoveLogo.addEventListener("click", () => {
    state.settings.companyLogo = "";
    els.settingsLogo.value = "";
    els.settingsLogoPreview.src = "";
    els.settingsLogoPreview.style.display = "none";
    els.settingsRemoveLogo.style.display = "none";
  });
}

function renderClients() {
  els.clientTable.innerHTML = "";
  els.clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';

  const sortedClients = [...state.clients].sort((a, b) => a.name.localeCompare(b.name));

  sortedClients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = `${client.name} (${client.document})`;
    els.clientSelect.appendChild(option);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="client-info-cell">
          <strong>${escapeHtml(client.name)}</strong>
          <span>${escapeHtml(client.document)}</span>
        </div>
      </td>
      <td>${escapeHtml(client.phone || "-")}</td>
      <td>${escapeHtml(client.city || "-")}/${escapeHtml(client.state || "-")}</td>
      <td class="actions-cell">
        <button class="icon-button edit-btn" title="Editar cliente" type="button">✏️</button>
        <button class="icon-button delete-btn" title="Excluir cliente" type="button">🗑️</button>
      </td>
    `;

    tr.querySelector(".edit-btn").addEventListener("click", () => {
      resetClientForm(client);
      openDialog("clientModal");
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`Deseja mesmo excluir o cliente "${client.name}"?\nIsso não apagará as notas já criadas para ele.`)) {
        state.clients = state.clients.filter((c) => c.id !== client.id);
        saveState();
        render();
        showToast("Cliente removido.");
      }
    });

    els.clientTable.appendChild(tr);
  });

  if (state.clients.length === 0) {
    els.clientTable.innerHTML = '<tr><td colspan="4" class="empty">Nenhum cliente cadastrado.</td></tr>';
  }
}

function resetClientForm(client = null) {
  const form = document.querySelector("#clientForm");
  form.reset();
  document.querySelector("#clientId").value = client ? client.id : "";
  document.querySelector("#clientModal title-text").textContent = client ? "Editar Cliente" : "Novo Cliente";

  if (client) {
    document.querySelector("#document").value = client.document || "";
    document.querySelector("#clientName").value = client.name || "";
    document.querySelector("#address").value = client.address || "";
    document.querySelector("#number").value = client.number || "";
    document.querySelector("#zip").value = client.zip || "";
    document.querySelector("#district").value = client.district || "";
    document.querySelector("#city").value = client.city || "";
    document.querySelector("#state").value = client.state || "";
    document.querySelector("#phone").value = client.phone || "";
  }
}

function setupForms() {
  document.querySelector("#clientForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.querySelector("#clientId").value;
    const clientData = {
      id: id || makeId(),
      document: document.querySelector("#document").value.trim(),
      name: document.querySelector("#clientName").value.trim(),
      address: document.querySelector("#address").value.trim(),
      number: document.querySelector("#number").value.trim(),
      zip: document.querySelector("#zip").value.trim(),
      district: document.querySelector("#district").value.trim(),
      city: document.querySelector("#city").value.trim(),
      state: document.querySelector("#state").value.trim().toUpperCase(),
      phone: document.querySelector("#phone").value.trim(),
    };

    if (id) {
      state.clients = state.clients.map((c) => (c.id === id ? clientData : c));
      showToast("Cliente atualizado.");
    } else {
      state.clients.push(clientData);
      showToast("Cliente cadastrado.");
    }

    saveState();
    closeDialog("clientModal");
    render();
  });

  const imageInput = document.querySelector("#invoiceImages");
  const previewContainer = document.querySelector("#imagePreviewContainer");

  imageInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (currentInvoiceImages.length + files.length > MAX_INVOICE_IMAGES) {
      showToast(`Limite máximo de ${MAX_INVOICE_IMAGES} imagens por nota.`);
      imageInput.value = "";
      return;
    }

    for (const file of files) {
      if (file.size > MAX_INVOICE_IMAGE_SIZE) {
        showToast(`A imagem "${file.name}" excede o tamanho máximo de 3MB.`);
        continue;
      }
      try {
        const base64 = await resizeAndConvertToBase64(file, INVOICE_IMAGE_MAX_DIMENSION);
        currentInvoiceImages.push({
          id: makeId(),
          title: file.name.substring(0, 30),
          src: base64,
        });
      } catch (err) {
        showToast("Erro ao processar um dos arquivos de imagem.");
      }
    }
    imageInput.value = "";
    renderInvoiceFormImages();
  });

  document.querySelector("#invoiceForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.querySelector("#invoiceId").value;
    const isPaid = document.querySelector("#isPaid").value === "true";

    const invoiceData = {
      id: id || makeId(),
      clientId: els.clientSelect.value,
      status: isPaid ? "pago" : getInvoiceStatusByDueDate(document.querySelector("#dueDate").value),
      issueDate: document.querySelector("#issueDate").value,
      dueDate: document.querySelector("#dueDate").value,
      paidDate: isPaid ? document.querySelector("#paidDate").value || new Date().toISOString().slice(0, 10) : "",
      value: parseFloat(document.querySelector("#invoiceValue").value) || 0,
      paymentMethod: document.querySelector("#paymentMethod").value,
      installments: parseInt(document.querySelector("#installments").value) || 1,
      vehicle: document.querySelector("#vehicle").value.trim(),
      km: document.querySelector("#km").value.trim(),
      description: document.querySelector("#description").value.trim(),
      observations: document.querySelector("#observations").value.trim(),
      images: [...currentInvoiceImages],
    };

    if (id) {
      state.invoices = state.invoices.map((item) => (item.id === id ? invoiceData : item));
      showToast("Nota fiscal atualizada.");
    } else {
      state.invoices.push(invoiceData);
      showToast("Nota fiscal criada.");
    }

    saveState();
    closeDialog("invoiceModal");
    render();
  });

  els.searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value.toLowerCase();
    renderInvoices();
  });

  els.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilters.status = btn.getAttribute("data-status");
      renderInvoices();
    });
  });
}

function getInvoiceStatusByDueDate(dueDateStr) {
  if (!dueDateStr) return "pendente";
  const todayStr = new Date().toISOString().slice(0, 10);
  return dueDateStr < todayStr ? "vencido" : "pendente";
}

function renderInvoiceFormImages() {
  const container = document.querySelector("#imagePreviewContainer");
  container.innerHTML = "";
  currentInvoiceImages.forEach((img, index) => {
    const item = document.createElement("div");
    item.className = "image-preview-item";
    item.innerHTML = `
      <img src="${img.src}" alt="Preview" />
      <input type="text" value="${escapeHtml(img.title)}" placeholder="Legenda..." />
      <button type="button" class="remove-img-btn">&times;</button>
    `;
    item.querySelector("input").addEventListener("input", (e) => {
      img.title = e.target.value;
    });
    item.querySelector(".remove-img-btn").addEventListener("click", () => {
      currentInvoiceImages.splice(index, 1);
      renderInvoiceFormImages();
    });
    container.appendChild(item);
  });
}

function resetInvoiceForm(invoice = null) {
  const form = document.querySelector("#invoiceForm");
  form.reset();
  currentInvoiceImages = invoice && invoice.images ? JSON.parse(JSON.stringify(invoice.images)) : [];
  document.querySelector("#invoiceId").value = invoice ? invoice.id : "";
  document.querySelector("#invoiceModal title-text").textContent = invoice ? "Editar Nota" : "Nova Nota";

  if (invoice) {
    els.clientSelect.value = invoice.clientId || "";
    document.querySelector("#isPaid").value = invoice.status === "pago" ? "true" : "false";
    document.querySelector("#issueDate").value = invoice.issueDate || "";
    document.querySelector("#dueDate").value = invoice.dueDate || "";
    document.querySelector("#paidDate").value = invoice.paidDate || "";
    document.querySelector("#invoiceValue").value = invoice.value || "";
    document.querySelector("#paymentMethod").value = invoice.paymentMethod || "dinheiro";
    document.querySelector("#installments").value = invoice.installments || 1;
    document.querySelector("#vehicle").value = invoice.vehicle || "";
    document.querySelector("#km").value = invoice.km || "";
    document.querySelector("#description").value = invoice.description || "";
    document.querySelector("#observations").value = invoice.observations || "";
  } else {
    document.querySelector("#issueDate").value = new Date().toISOString().slice(0, 10);
    document.querySelector("#dueDate").value = new Date().toISOString().slice(0, 10);
  }

  updatePaidDateVisibility();
  updateInstallmentsVisibility();
  renderInvoiceFormImages();
}

function updatePaidDateVisibility() {
  const isPaid = document.querySelector("#isPaid").value === "true";
  const wrap = document.querySelector("#paidDateWrap");
  wrap.style.display = isPaid ? "block" : "none";
  if (!isPaid) document.querySelector("#paidDate").value = "";
}

function updateInstallmentsVisibility() {
  const method = document.querySelector("#paymentMethod").value;
  const wrap = document.querySelector("#installmentsWrap");
  wrap.style.display = method === "cartao_credito" ? "block" : "none";
  if (method !== "cartao_credito") document.querySelector("#installments").value = "1";
}

document.querySelector("#isPaid").addEventListener("change", (event) => {
  updatePaidDateVisibility();
  if (event.target.value === "true" && !document.querySelector("#paidDate").value) {
    document.querySelector("#paidDate").value = new Date().toISOString().slice(0, 10);
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
      throw new Error("Formato inválido");
    }

    state = normalizeState({
      clients: imported.clients,
      invoices: imported.invoices,
      settings: imported.settings || state.settings,
    });
    saveState();
    render();
    showToast("Dados importados com sucesso!");
  } catch (err) {
    alert("Falha ao importar arquivo JSON: " + err.message);
  } finally {
    event.target.value = "";
  }
});

function renderInvoices() {
  els.invoiceTable.innerHTML = "";

  const updatedInvoices = state.invoices.map((inv) => {
    if (inv.status !== "pago") {
      const newStatus = getInvoiceStatusByDueDate(inv.dueDate);
      if (newStatus !== inv.status) {
        return { ...inv, status: newStatus };
      }
    }
    return inv;
  });

  if (JSON.stringify(updatedInvoices) !== JSON.stringify(state.invoices)) {
    state.invoices = updatedInvoices;
    saveState();
  }

  let list = [...state.invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  if (activeFilters.status !== "todos") {
    list = list.filter((item) => item.status === activeFilters.status);
  }

  if (activeFilters.search) {
    list = list.filter((item) => {
      const client = state.clients.find((c) => c.id === item.clientId);
      const name = client ? client.name.toLowerCase() : "";
      const doc = client ? client.document.toLowerCase() : "";
      const desc = item.description.toLowerCase();
      const veh = item.vehicle.toLowerCase();
      const q = activeFilters.search;
      return name.includes(q) || doc.includes(q) || desc.includes(q) || veh.includes(q) || item.id.toLowerCase().includes(q);
    });
  }

  list.forEach((inv) => {
    const client = state.clients.find((c) => c.id === inv.clientId);
    const tr = document.createElement("tr");

    let statusBadge = "";
    if (inv.status === "pago") statusBadge = '<span class="badge status-pago">Pago</span>';
    else if (inv.status === "vencido") statusBadge = '<span class="badge status-vencido">Vencido</span>';
    else statusBadge = '<span class="badge status-pendente">No prazo</span>';

    tr.innerHTML = `
      <td>
        <div class="client-info-cell">
          <strong>${escapeHtml(client ? client.name : "Cliente Deletado")}</strong>
          <span>${escapeHtml(inv.vehicle || "Sem veículo")}</span>
        </div>
      </td>
      <td>${formatDate(inv.dueDate)}</td>
      <td><strong>${formatCurrency(inv.value)}</strong></td>
      <td>${statusBadge}</td>
      <td class="actions-cell">
        <button class="icon-button view-btn" title="Visualizar resumo" type="button">👁️</button>
        <button class="icon-button delete-btn" title="Excluir nota" type="button">🗑️</button>
      </td>
    `;

    tr.querySelector(".view-btn").addEventListener("click", () => {
      showInvoiceSummary(inv.id);
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Excluir definitivamente esta nota fiscal?")) {
        state.invoices = state.invoices.filter((item) => item.id !== inv.id);
        saveState();
        render();
        showToast("Nota fiscal excluída.");
      }
    });

    els.invoiceTable.appendChild(tr);
  });

  if (list.length === 0) {
    els.invoiceTable.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma nota fiscal encontrada.</td></tr>';
  }
}

function showInvoiceSummary(id) {
  const inv = state.invoices.find((item) => item.id === id);
  if (!inv) return;

  currentSummaryInvoiceId = id;
  const client = state.clients.find((c) => c.id === inv.clientId);

  els.summaryClientName.textContent = client ? client.name : "Cliente não cadastrado";
  els.summaryClientDoc.textContent = client ? client.document : "-";
  els.summaryClientPhone.textContent = client ? client.phone || "-" : "-";
  
  let fullAddress = "-";
  if (client && client.address) {
    fullAddress = `${client.address}, ${client.number || "S/N"}`;
    if (client.district) fullAddress += ` - ${client.district}`;
    if (client.city) fullAddress += ` - ${client.city}/${client.state || ""}`;
  }
  els.summaryClientAddress.textContent = fullAddress;

  els.summaryId.textContent = inv.id;
  els.summaryIssueDate.textContent = formatDate(inv.issueDate);
  els.summaryDueDate.textContent = formatDate(inv.dueDate);
  els.summaryPaidDate.textContent = inv.paidDate ? formatDate(inv.paidDate) : "-";
  els.summaryValue.textContent = formatCurrency(inv.value);
  
  const methodsMap = { dinero: "Dinheiro", pix: "Pix", cartao_debito: "Cartão de Débito", cartao_credito: "Cartão de Crédito", boleto: "Boleto", transferencia: "Transferência" };
  els.summaryPaymentMethod.textContent = methodsMap[inv.paymentMethod] || inv.paymentMethod;
  els.summaryInstallments.textContent = inv.paymentMethod === "cartao_credito" ? `${inv.installments}x` : "-";
  
  els.summaryVehicle.textContent = inv.vehicle || "-";
  els.summaryKm.textContent = inv.km ? `${inv.km} km` : "-";
  els.summaryDescription.textContent = inv.description || "Nenhuma descrição informada.";
  els.summaryObservations.textContent = inv.observations || "-";

  els.summaryStatus.className = "badge";
  if (inv.status === "pago") {
    els.summaryStatus.textContent = "Pago";
    els.summaryStatus.classList.add("status-pago");
  } else if (inv.status === "vencido") {
    els.summaryStatus.textContent = "Vencido";
    els.summaryStatus.classList.add("status-vencido");
  } else {
    els.summaryStatus.textContent = "No prazo";
    els.summaryStatus.classList.add("status-pendente");
  }

  els.summaryImages.innerHTML = "";
  if (inv.images && inv.images.length > 0) {
    inv.images.forEach((img) => {
      const figure = document.createElement("figure");
      figure.className = "summary-image-item";
      figure.innerHTML = `
        <img src="${img.src}" alt="Anexo" />
        <figcaption>${escapeHtml(img.title || "Anexo sem legenda")}</figcaption>
      `;
      figure.querySelector("img").addEventListener("click", () => {
        const w = window.open();
        w.document.write(`<img src="${img.src}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
      });
      els.summaryImages.appendChild(figure);
    });
  } else {
    els.summaryImages.innerHTML = '<p class="muted" style="grid-column: 1/-1; padding: 10px 0;">Nenhuma foto anexada a esta nota.</p>';
  }

  openDialog("invoiceSummaryModal");
}

function renderDashboard() {
  let total = 0;
  let pago = 0;
  let pendente = 0;

  state.invoices.forEach((inv) => {
    if (inv.status === "pago") {
      pago += inv.value;
    } else {
      pendente += inv.value;
    }
    total += inv.value;
  });

  els.statsTotal.textContent = formatCurrency(total);
  els.statsPago.textContent = formatCurrency(pago);
  els.statsPendente.textContent = formatCurrency(pendente);
}

function resizeAndConvertToBase64(file, maxDimension) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildCompanyHeaderHtml(isPrint = false) {
  const name = state.settings.companyName || "Sua Empresa";
  const cnpj = state.settings.companyCnpj ? `CNPJ: ${state.settings.companyCnpj}` : "CNPJ não configurado";
  const phone = state.settings.companyNumber ? `Contato: ${state.settings.companyNumber}` : "";
  
  if (state.settings.companyLogo) {
    return `
      <div class="company-header">
        <img class="company-logo" src="${state.settings.companyLogo}" alt="Logo" />
        <div>
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(cnpj)} ${phone ? " | " + escapeHtml(phone) : ""}</span>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="company-header">
        <div class="company-logo placeholder">M&C</div>
        <div>
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(cnpj)} ${phone ? " | " + escapeHtml(phone) : ""}</span>
        </div>
      </div>
    `;
  }
}

function printServiceOrder(invoiceId) {
  const inv = state.invoices.find((i) => i.id === invoiceId);
  if (!inv) return;

  const client = state.clients.find((c) => c.id === inv.clientId);
  const methodsMap = { dinheiro: "Dinheiro", pix: "Pix", cartao_debito: "Cartão de Débito", cartao_credito: "Cartão de Crédito", boleto: "Boleto", transferencia: "Transferência" };

  let statusLabel = "NO PRAZO";
  let statusClass = "status-text-no-prazo";
  if (inv.status === "pago") {
    statusLabel = "PAGO";
    statusClass = "status-text-pago";
  } else if (inv.status === "vencido") {
    statusLabel = "VENCIDO";
    statusClass = "status-text-vencido";
  }

  let clientAddressStr = "-";
  if (client && client.address) {
    clientAddressStr = `${client.address}, ${client.number || "S/N"}`;
    if (client.district) clientAddressStr += ` - ${client.district}`;
    if (client.city) clientAddressStr += ` - ${client.city}/${client.state || ""}`;
    if (client.zip) clientAddressStr += ` (CEP: ${client.zip})`;
  }

  let imagesHtml = "";
  if (inv.images && inv.images.length > 0) {
    imagesHtml = `
      <div class="print-images">
        <h2>Imagens e Comprovantes Anexados</h2>
        <div class="print-image-grid">
          ${inv.images
            .map(
              (img) => `
            <figure>
              <img src="${img.src}" alt="Anexo" />
              <figcaption>${escapeHtml(img.title || "Imagem em anexo")}</figcaption>
            </figure>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  const content = `
    <div class="os-summary">
      <div class="summary-block summary-primary">
        <span>Código do Registro</span>
        <strong>${inv.id}</strong>
      </div>
      <div class="summary-block">
        <span>Valor Total</span>
        <strong class="money-value">${formatCurrency(inv.value)}</strong>
      </div>
      <div class="summary-block">
        <span>Situação</span>
        <strong class="status-text ${statusClass}">${statusLabel}</strong>
      </div>
    </div>

    <div class="section-title">Dados do Cliente</div>
    <div class="detail-grid">
      <div class="detail-card">
        <div class="field-list">
          <div class="wide">
            <span>Nome Completo / Razão Social</span>
            <strong>${escapeHtml(client ? client.name : "Cliente não encontrado")}</strong>
          </div>
          <div>
            <span>CPF / CNPJ</span>
            <strong>${escapeHtml(client ? client.document : "-")}</strong>
          </div>
          <div>
            <span>Telefone de Contato</span>
            <strong>${escapeHtml(client ? client.phone || "-" : "-")}</strong>
          </div>
          <div class="wide">
            <span>Endereço Completo</span>
            <strong>${escapeHtml(clientAddressStr)}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">Especificações e Prazos</div>
    <div class="detail-grid">
      <div class="detail-card">
        <div class="field-list">
          <div>
            <span>Data de Emissão</span>
            <strong>${formatDate(inv.issueDate)}</strong>
          </div>
          <div>
            <span>Data de Vencimento</span>
            <strong>${formatDate(inv.dueDate)}</strong>
          </div>
          <div>
            <span>Data de Pagamento</span>
            <strong>${inv.paidDate ? formatDate(inv.paidDate) : "-"}</strong>
          </div>
          <div>
            <span>Forma de Pagamento</span>
            <strong>${methodsMap[inv.paymentMethod] || inv.paymentMethod}</strong>
          </div>
          <div>
            <span>Parcelamento</span>
            <strong>${inv.paymentMethod === "cartao_credito" ? `${inv.installments}x` : "À vista"}</strong>
          </div>
          <div>
            <span>Veículo / Máquina</span>
            <strong>${escapeHtml(inv.vehicle || "-")}</strong>
          </div>
          <div>
            <span>Quilometragem / Horas</span>
            <strong>${inv.km ? `${escapeHtml(inv.km)} km` : "-"}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">Descrição Detalhada do Serviço / Venda</div>
    <div class="notes-box" style="margin-bottom: 14px;">
      <p style="white-space: pre-wrap; margin:0;">${escapeHtml(inv.description || "Nenhum detalhe informado.")}</p>
    </div>

    ${inv.observations ? `
      <div class="section-title">Observações Importantes</div>
      <div class="notes-box" style="margin-bottom: 14px;">
        <p style="white-space: pre-wrap; margin:0;">${escapeHtml(inv.observations)}</p>
      </div>
    ` : ""}

    ${imagesHtml}

    <div class="signature-grid">
      <div>
        <span></span>
        <strong>Assinatura do Emitente</strong>
      </div>
      <div>
        <span></span>
        <strong>Assinatura do Cliente</strong>
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, ative as janelas pop-up para conseguir imprimir.");
    return;
  }

  printWindow.document.write(buildPrintableDocument({
    title: `Nota Fiscal / Ordem de Serviço`,
    subtitle: `Documento impresso em ${new Date().toLocaleDateString("pt-BR")}`,
    orientation: "portrait",
    content
  }));
  printWindow.document.close();
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
            margin: ${orientation === "portrait" ? "15mm 12mm 15mm 12mm" : "12mm 10mm"};
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            color: #101828;
            background: #ffffff;
            font-family: Arial, "Segoe UI", sans-serif;
            font-size: 12px;
            line-height: 1.4;
            width: 100%;
          }
          .document-page {
            width: 100%;
            max-width: 100%;
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
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            table-layout: fixed;
          }
          th,
          td {
            padding: 8px 10px;
            border: 1px solid #d7dee8;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
            word-wrap: break-word;
            white-space: normal;
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
          .os-summary {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
            width: 100%;
          }
          .summary-block {
            flex: 1;
            min-width: 0;
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
          <div class="table-wrap-print">
            ${content}
          </div>
        </main>
        <div class="print-actions">
          <button type="button" onclick="window.print()">Imprimir / salvar PDF</button>
        </div>
      </body>
    </html>
  `;
}

window.addEventListener("DOMContentLoaded", init);
