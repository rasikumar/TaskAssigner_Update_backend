import cron from "node-cron";
import { checkAndUpdateMilestoneStatus } from "../Controller/Milestone_controller.js";

import mongoose from "mongoose";

const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1; // 1 means connected
};

// Schedule the cron job to run every minute
cron.schedule("* * * * *", async () => {
  console.log("⏳ Cron job started: Checking milestone statuses...");
  if (!isDatabaseConnected()) {
    console.log("⛔ Skipping cron job due to MongoDB connection failure.");
    return;
  }
  try {
    await checkAndUpdateMilestoneStatus();
    console.log("✅ Cron job completed successfully.");
  } catch (error) {
    console.error("❌ Error in cron job:", error);
  }
});
