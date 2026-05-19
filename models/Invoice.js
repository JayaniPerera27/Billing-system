const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    invoiceDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerAddress: {
      type: String,
      trim: true,
      default: ""
    },
    projectName: {
      type: String,
      trim: true,
      default: ""
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: "At least one invoice item is required."
      }
    },
    discount: {
      type: Number,
      min: 0,
      default: 0
    },
    discountType: {
      type: String,
      enum: ["amount", "percentage"],
      default: "amount"
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0
    },
    advancePayment: {
      type: Number,
      min: 0,
      default: 0
    },
    tax: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

invoiceSchema.virtual("subtotal").get(function subtotal() {
  return this.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
});

invoiceSchema.virtual("discountAmount").get(function discountAmount() {
  const value = this.discountValue || this.discount || 0;

  if (this.discountType === "percentage") {
    return Math.min(this.subtotal * (value / 100), this.subtotal);
  }

  return Math.min(value, this.subtotal);
});

invoiceSchema.virtual("total").get(function total() {
  return Math.max(this.subtotal + this.tax - this.discountAmount, 0);
});

invoiceSchema.virtual("balanceDue").get(function balanceDue() {
  return Math.max(this.total - this.advancePayment, 0);
});

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
