const express = require("express");
const Invoice = require("../models/Invoice");

const router = express.Router();

async function getNextInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const invoiceNumberPattern = new RegExp(`^SM/${currentYear}/(\\d+)$`);
  const invoices = await Invoice.find({ invoiceNumber: invoiceNumberPattern })
    .select("invoiceNumber")
    .lean();
  const highestNumber = invoices.reduce((highest, invoice) => {
    const match = invoice.invoiceNumber.match(invoiceNumberPattern);
    const currentNumber = match ? Number.parseInt(match[1], 10) : 0;

    return Math.max(highest, currentNumber);
  }, 1000);

  return `SM/${currentYear}/${highestNumber + 1}`;
}

router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Could not load invoices.", error: error.message });
  }
});

router.get("/next-number", async (req, res) => {
  try {
    res.json({ invoiceNumber: await getNextInvoiceNumber() });
  } catch (error) {
    res.status(500).json({ message: "Could not create next invoice number.", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Could not load invoice.", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber: req.body.invoiceNumber || (await getNextInvoiceNumber())
    });
    res.status(201).json(invoice);
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;
    res.status(status).json({ message: "Could not save invoice.", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: "Could not update invoice.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    res.json({ message: "Invoice deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete invoice.", error: error.message });
  }
});

module.exports = router;
