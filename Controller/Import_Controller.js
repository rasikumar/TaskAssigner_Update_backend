import { UserModel } from "../Model/User_scheme.js";
import { TaskModel } from "../Model/Task_scheme.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
const CHUNK_SIZE = 100;

async function findUserByMail(mail) {
  try {
    const user = await UserModel.findOne({ mail: mail });
    return user ? user._id : null;
  } catch (error) {
    console.log(`Error finding user by mail ${mail}:`, error);
    return null;
  }
}

// Function to validate a row
function validateRow(row) {
  const errors = [];

  const projectTitle = row.getCell(1).value; // Cell 1
  const projectOwnershipCell = row.getCell(2).value; // Cell 2
  const projectDescription = row.getCell(3).value; // Cell 3
  const priority = row.getCell(4).value; // Cell 4
  const assignedToCell = row.getCell(5).value; // Cell 5
  const assignedByCell = row.getCell(6).value; // Cell 6
  const reportToCell = row.getCell(7).value; // Cell 7
  const status = row.getCell(8).value;

  const projectOwnershipEmail = projectOwnershipCell?.hyperlink
    ? projectOwnershipCell.hyperlink.replace("mailto:", "")
    : null;
  const assignedToEmail = assignedToCell?.hyperlink
    ? assignedToCell.hyperlink.replace("mailto:", "")
    : null;
  const assignedByEmail = assignedByCell?.hyperlink
    ? assignedByCell.hyperlink.replace("mailto:", "")
    : null;
  const reportToEmail = reportToCell?.hyperlink
    ? reportToCell.hyperlink.replace("mailto:", "")
    : null;

    const isRowEmpty =
      !projectTitle &&
      !projectDescription &&
      !projectOwnershipEmail &&
      !assignedToEmail &&
      !assignedByEmail &&
      !reportToEmail &&
      !status &&
      !priority;

    // If the row is empty, skip validation and return valid
    if (isRowEmpty) {
      return {
        isValid: true,
        errors: [],
        isRowEmpty: true, // No errors, row is empty and should be skipped
      };
    }

  // Check for required fields
  if (!projectTitle || projectTitle.trim() === "")
    errors.push("Project title is required.");

  if (!projectDescription || projectDescription.trim() === "")
    errors.push("Project description is required.");

  // Check for valid references
  if (
    !projectOwnershipEmail &&
    !mongoose.Types.ObjectId.isValid(projectOwnershipEmail)
  )
    errors.push("Invalid project ownership mail.");

  if (!assignedToEmail && !mongoose.Types.ObjectId.isValid(assignedToEmail))
    errors.push("Invalid assigned to ID.");

  if (!assignedByEmail && !mongoose.Types.ObjectId.isValid(assignedByEmail))
    errors.push("Invalid assigned by ID.");

  if (!reportToEmail && !mongoose.Types.ObjectId.isValid(reportToEmail))
    errors.push("Invalid report to ID.");

  // Check for valid status
  const validStatuses = [
    "Not started",
    "In progress",
    "Pending",
    "Completed",
    "Cancelled",
  ];

  if (status && !validStatuses.includes(status))
    errors.push("Invalid status value.");

  // Check for valid priority
  const validPriorities = ["Low", "Regular", "High", "Critical"];
  if (priority && !validPriorities.includes(priority))
    errors.push("Invalid priority value.");

  // Return validation result
  return {
    isValid: errors.length === 0,
    errors: errors,
    projectOwnershipEmail,
    assignedToEmail,
    assignedByEmail,
    reportToEmail,
    isRowEmpty: false,
  };
}

// Function to import tasks from Excel with validation and error handling
export async function importToExcel(buffer) {
  const tasks = [];
  const errors = [];
  let taskBatch = [];

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);

    // Loop through each row synchronously, starting from row 2 to skip the header
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const {
        isValid,
        errors: rowErrors,
        projectOwnershipEmail,
        assignedToEmail,
        assignedByEmail,
        reportToEmail,
        isRowEmpty,
      } = validateRow(row);
      if(isRowEmpty){
        continue;
      }

      if (!isValid) {
        errors.push({ rowNumber, errors: rowErrors });
        continue; // Skip invalid rows
      }

      if (!projectOwnershipEmail && !assignedToEmail && !assignedByEmail && !reportToEmail) {
        continue;
      }

      const projectOwnership = await findUserByMail(projectOwnershipEmail);
      const assignedTo = await findUserByMail(assignedToEmail);
      const assignedBy = await findUserByMail(assignedByEmail);
      const reportTo = await findUserByMail(reportToEmail);

      // Create a task document
      const task = {
        project_title: row.getCell(1).value,
        project_ownership: projectOwnership,
        project_description: row.getCell(3).value,
        priority: row.getCell(4).value,
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        report_to: reportTo,
        status: row.getCell(8).value,
        start_date: row.getCell(9).value,
        end_date: row.getCell(10).value,
        task_description: row.getCell(11).value,
      };

      taskBatch.push(task);

      if (taskBatch.length >= CHUNK_SIZE) {
        await TaskModel.insertMany(taskBatch);
        taskBatch = [];
      }
    }

    if (taskBatch.length > 0) {
      await TaskModel.insertMany(taskBatch);
    }

    if (errors.length > 0) {
      return {
        success: true,
        message: "Tasks imported with some errors.",
        errors,
      };
    }
    return {
      success: true,
      message: "Tasks imported and populated successfully!",
    };
  } catch (error) {
    console.error("Error importing tasks:", error);
    return { success: false, message: "Error importing tasks.", error };
  }
}





