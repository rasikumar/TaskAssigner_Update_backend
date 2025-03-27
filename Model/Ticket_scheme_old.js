import mongoose from "mongoose";
const ticketScheme = new mongoose.Schema({
  ticket_title: {
    type: String,
    required: true,
  },
  ticket_description: {
    type: String,
    required: true,
  },
  main_category: {
    type: String,
  },
  sub_category: {
    type: String,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  status: {
    type: String,
    enum: ["Open", "In progress", "Resolved"],
    default: "Open",
  },
  priority: {
    type: String,
    enum: ["Low", "Regular", "High"],
    default: "Low",
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
});

export const TicketModel = mongoose.model("tickets", ticketScheme);
