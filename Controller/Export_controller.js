import multer from "multer";

import ExcelJS from "exceljs";


export const exportToExcel = async (data, filePath) => {
  // Create a new workbook and add a worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Sheet");

  // Define the columns (modify as per your data structure)
  worksheet.columns = [
    { header: "Project Title", key: "project_title", width: 20 },
    { header: "Project Description", key: "project_description", width: 30 },
    { header: "Ownership:", key: "project_ownership_name", width: 20 },
    { header: "Priority:", key: "priority", width: 20 },
    { header: "Assigned To:", key: "assigned_to_name", width: 20 },
    { header: "Assigned By:", key: "assigned_by_name", width: 20 },
    { header: "Report To:", key: "report_to", width: 20 },
    { header: "Status:", key: "status", width: 20 },
    { header: "Start Date:", key: "start_date", width: 20 },
    { header: "End Date:", key: "end_date", width: 20 },
    { header: "Task Description:", key: "task_description", width: 30 },
  ];
  worksheet.getRow(1).values = ["This is a merged cell"];
  worksheet.mergeCells("A1:D1");
  worksheet.getCell("A1").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getRow(2).values = [
    "Project Title",
    "Project Description",
    "Ownership",
    "Priority",
    "Assigned To",
    "Assigned By",
    "Report To",
    "Status",
    "Start Date",
    "End Date",
    "Task Description",
  ];
  worksheet.getCell("A2", "B2", "C2").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getRow(2).eachCell((cell) => {
    cell.font = { color: { argb: "f9fbfd" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "49564c" }, // #49564c background
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    }; // Center align text
  });
  // Add rows to the worksheet
  data.forEach((item) => {
    worksheet.addRow({
      project_title: item.project_title,
      project_description: item.project_description,
      project_ownership_name: item.project_ownership?.mail || "",
      priority: item.priority,
      assigned_to_name: item.assigned_to?.mail || "",
      assigned_by_name: item.assigned_by?.mail || "",
      report_to: item.report_to?.mail || "",
      status: item.status,
      start_date: item.start_date,
      end_date: item.end_date,
      task_description: item.task_description,
    });
  });

  // Save the workbook to the specified file path
  return await workbook.xlsx.writeBuffer();

}

// export const importFromExcel = async(data);
