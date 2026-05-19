const form = document.querySelector("#invoiceForm");
const itemsContainer = document.querySelector("#items");
const addItemButton = document.querySelector("#addItem");
const invoiceList = document.querySelector("#invoiceList");
const statusEl = document.querySelector("#status");
const refreshInvoicesButton = document.querySelector("#refreshInvoices");
const printInvoiceButton = document.querySelector("#printInvoice");

let editingInvoiceId = null;

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR"
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

async function setNextInvoiceNumber() {
  try {
    const response = await fetch("/api/invoices/next-number");
    const result = await response.json();
    form.invoiceNumber.value = result.invoiceNumber || "SM-1001";
  } catch (error) {
    form.invoiceNumber.value = "SM-1001";
  }
}

function numberValue(value) {
  return Number.parseFloat(value) || 0;
}

async function resetFormForNewInvoice() {
  editingInvoiceId = null;
  form.reset();
  form.invoiceDate.value = today();
  form.discountType.value = "amount";
  form.discountValue.value = 0;
  form.tax.value = 0;
  form.advancePayment.value = 0;
  itemsContainer.innerHTML = "";
  makeItemRow();
  await setNextInvoiceNumber();
  updatePreview();
}

function makeItemRow(item = { description: "", quantity: 1, rate: 0 }) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input class="item-description" placeholder="Work description" required value="${escapeAttribute(item.description)}">
    <input class="item-quantity" type="number" min="0" step="0.01" value="${item.quantity}" required>
    <input class="item-rate" type="number" min="0" step="0.01" value="${item.rate}" required>
    <span class="line-total">${money.format(numberValue(item.quantity) * numberValue(item.rate))}</span>
    <button class="remove-item" type="button" aria-label="Remove item">X</button>
  `;
  row.addEventListener("input", updatePreview);
  row.querySelector(".remove-item").addEventListener("click", () => {
    if (itemsContainer.children.length > 1) {
      row.remove();
      updatePreview();
    }
  });
  itemsContainer.appendChild(row);
}

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readItems() {
  return [...itemsContainer.querySelectorAll(".item-row")].map((row) => ({
    description: row.querySelector(".item-description").value.trim(),
    quantity: numberValue(row.querySelector(".item-quantity").value),
    rate: numberValue(row.querySelector(".item-rate").value)
  }));
}

function readInvoice() {
  return {
    invoiceNumber: form.invoiceNumber.value.trim(),
    invoiceDate: form.invoiceDate.value,
    dueDate: form.dueDate.value || undefined,
    customerName: form.customerName.value.trim(),
    customerAddress: form.customerAddress.value.trim(),
    projectName: form.projectName.value.trim(),
    notes: form.notes.value.trim(),
    discountType: form.discountType.value,
    discountValue: numberValue(form.discountValue.value),
    advancePayment: numberValue(form.advancePayment.value),
    tax: numberValue(form.tax.value),
    items: readItems().filter((item) => item.description)
  };
}

function calculateDiscount(subtotal, discountType, discountValue) {
  if (discountType === "percentage") {
    return Math.min(subtotal * (discountValue / 100), subtotal);
  }

  return Math.min(discountValue, subtotal);
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value || "";
}

function updatePreview() {
  const invoice = readInvoice();
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discountAmount = calculateDiscount(subtotal, invoice.discountType, invoice.discountValue);
  const total = Math.max(subtotal + invoice.tax - discountAmount, 0);
  const balanceDue = Math.max(total - invoice.advancePayment, 0);
  const discountLabel =
    invoice.discountType === "percentage"
      ? `${money.format(discountAmount)} (${invoice.discountValue || 0}%)`
      : money.format(discountAmount);

  setText("#previewInvoiceNumber", invoice.invoiceNumber || "New Invoice");
  setText("#previewCustomer", invoice.customerName || "Customer name");
  setText("#previewAddress", invoice.customerAddress);
  setText("#previewDate", invoice.invoiceDate ? `Invoice date: ${invoice.invoiceDate}` : "Invoice date");
  setText("#previewDueDate", invoice.dueDate ? `Due date: ${invoice.dueDate}` : "");
  setText("#previewProject", invoice.projectName ? `Project: ${invoice.projectName}` : "");
  setText("#previewSubtotal", money.format(subtotal));
  setText("#previewDiscount", discountLabel);
  setText("#previewTax", money.format(invoice.tax));
  setText("#previewTotal", money.format(total));
  setText("#previewAdvance", money.format(invoice.advancePayment));
  setText("#previewBalance", money.format(balanceDue));
  setText("#previewNotes", invoice.notes || "Thank you for your business.");

  document.querySelectorAll(".item-row:not(.item-head)").forEach((row) => {
    const quantity = numberValue(row.querySelector(".item-quantity").value);
    const rate = numberValue(row.querySelector(".item-rate").value);
    row.querySelector(".line-total").textContent = money.format(quantity * rate);
  });

  document.querySelector("#previewItems").innerHTML = invoice.items
    .map(
      (item) => `
        <tr>
          <td>${escapeAttribute(item.description)}</td>
          <td>${item.quantity}</td>
          <td>${money.format(item.rate)}</td>
          <td>${money.format(item.quantity * item.rate)}</td>
        </tr>
      `
    )
    .join("");
}

function fillForm(invoice) {
  editingInvoiceId = invoice._id || null;
  form.invoiceNumber.value = invoice.invoiceNumber || "";
  form.invoiceDate.value = formatDate(invoice.invoiceDate) || today();
  form.dueDate.value = formatDate(invoice.dueDate);
  form.customerName.value = invoice.customerName || "";
  form.customerAddress.value = invoice.customerAddress || "";
  form.projectName.value = invoice.projectName || "";
  form.notes.value = invoice.notes || "";
  form.discountType.value = invoice.discountType || "amount";
  form.discountValue.value = invoice.discountValue ?? invoice.discount ?? 0;
  form.advancePayment.value = invoice.advancePayment || 0;
  form.tax.value = invoice.tax || 0;
  itemsContainer.innerHTML = "";
  (invoice.items || [{ description: "", quantity: 1, rate: 0 }]).forEach(makeItemRow);
  updatePreview();
}

async function loadInvoices() {
  statusEl.textContent = "Loading invoices...";
  try {
    const response = await fetch("/api/invoices");
    const invoices = await response.json();
    invoiceList.innerHTML = invoices
      .map(
        (invoice) => `
          <article class="invoice-card" data-id="${invoice._id}">
            <strong>${escapeAttribute(invoice.invoiceNumber)}</strong>
            <span>${escapeAttribute(invoice.customerName)} - ${money.format(invoice.total || 0)}</span>
            <div class="invoice-card-actions">
              <button type="button" data-action="load">Load</button>
              <button type="button" class="secondary" data-action="delete">Delete</button>
            </div>
          </article>
        `
      )
      .join("");
    statusEl.textContent = invoices.length ? `${invoices.length} invoice(s) saved.` : "No saved invoices yet.";
  } catch (error) {
    statusEl.textContent = "Could not load invoices. Check that the server and MongoDB are connected.";
  }
}

async function saveInvoice(event) {
  event.preventDefault();
  const invoice = readInvoice();
  const url = editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : "/api/invoices";
  const method = editingInvoiceId ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice)
  });

  const result = await response.json();

  if (!response.ok) {
    statusEl.textContent = result.message || "Could not save invoice.";
    return;
  }

  editingInvoiceId = result._id;
  statusEl.textContent = "Invoice saved.";
  await loadInvoices();
  await resetFormForNewInvoice();
}

async function handleInvoiceListClick(event) {
  const card = event.target.closest(".invoice-card");
  const action = event.target.dataset.action;

  if (!card || !action) return;

  if (action === "load") {
    const response = await fetch(`/api/invoices/${card.dataset.id}`);
    const invoice = await response.json();
    fillForm(invoice);
  }

  if (action === "delete") {
    await fetch(`/api/invoices/${card.dataset.id}`, { method: "DELETE" });
    if (editingInvoiceId === card.dataset.id) {
      editingInvoiceId = null;
    }
    await loadInvoices();
  }
}

form.addEventListener("input", updatePreview);
form.addEventListener("submit", saveInvoice);
addItemButton.addEventListener("click", () => {
  makeItemRow();
  updatePreview();
});
refreshInvoicesButton.addEventListener("click", loadInvoices);
invoiceList.addEventListener("click", handleInvoiceListClick);
printInvoiceButton.addEventListener("click", () => {
  const originalTitle = document.title;
  document.title = form.invoiceNumber.value || " ";
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 500);
});

resetFormForNewInvoice();
loadInvoices();
