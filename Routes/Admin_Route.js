import express from "express";
import multer from "multer";
import path from "path";
import * as Admin from "../Controller/Admin_controller.js";
import * as Task from "../Controller/Task_Controller.js";
import * as User from "../Controller/User_Controller.js";
// import * as Ticket from "../Controller/Ticket_controller_old.js";
import * as Project from "../Controller/Project_controller.js";
import * as Milestone from "../Controller/Milestone_controller.js";
import * as Ticket from "../Controller/Ticket_controller.js";
import * as document from "../Controller/document_controller.js";
// import upload_project from "../middleware/upload.js";

const adminRoute = express.Router();

//check

adminRoute.post("/login", Admin.admin_check);
adminRoute.post("/createUser", Admin.authMiddleware, User.createUser);
adminRoute.get("/dashboard", Admin.authMiddleware, Admin.admin_dashboard);
adminRoute.post("/createTask", Admin.authMiddleware, Task.createTask);
adminRoute.put("/updateTask", Admin.authMiddleware, Task.updateTask);
adminRoute.put("/editStatus", Admin.authMiddleware, Task.editTaskStatus);
adminRoute.post("/getAllTask", Admin.authMiddleware, Task.getAllTask);
adminRoute.post("/getTask", Admin.authMiddleware, Task.getTask);
adminRoute.delete("/deleteTask/:id", Task.deleteTask);
adminRoute.get("/getEmpMails", Admin.authMiddleware, User.getAllUserEmpMail);
adminRoute.get(
  "/getAllUserEmpMailForProject",
  Admin.authMiddleware,
  User.getAllUserEmpMailForProject
);
adminRoute.post(
  "/getDepartmentWiseEmployee",
  Admin.authMiddleware,
  User.getEmployeesByDepartment
);

adminRoute.post("/getTaskByEmployee",Admin.authMiddleware,Task.getTaskByEmployee)
adminRoute.post("/getAllEmployee", Admin.authMiddleware, User.getAllEmployee);
adminRoute.post("/create", Admin.authMiddleware, User.createUser);

adminRoute.put("/update", Admin.authMiddleware, User.updateUser);

//milestone routes
adminRoute.get(
  "/get_project_milestone/:projectId",
  Admin.authMiddleware,
  Milestone.getMilestones_project_WithTasks_status
);

adminRoute.post(
  "/verify/:userId",
  Admin.authMiddleware,
  Admin.verifyUserByAdmin
);
adminRoute.post("/approve", User.authMiddleware, User.approveUserByHR);

// userRoute.post("/verify/:userId", User.authMiddleware,verifyUserByAdmin);
adminRoute.post("/approveHr", Admin.authMiddleware, User.approveUserByHR);

adminRoute.post("/delete", Admin.authMiddleware, User.deleteUser);
adminRoute.post("/findById", Admin.authMiddleware, User.findById);
adminRoute.post("/empid-generate", Admin.authMiddleware, User.empid_generate);

// adminRoute.post("/getAllTicket", Admin.authMiddleware, Ticket.getAllTicket);
adminRoute.post("/getTicketById", Ticket.getTicketById);

// adminRoute.post(
//   "/getTicketByCategory",
//   Admin.authMiddleware,
//   Ticket.getTicketByCategory
// );

// const projectstorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const fileExtension = path.extname(file.originalname);
//     cb(null, Date.now() + '-' + file.originalname + fileExtension);
//   }

// });

// const project_upload = multer({
//   storage: projectstorage,
//   limits: { fileSize: 10 * 1024 * 1024 },
// }).single('attachment');

const projectstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure 'uploads/' exists
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension); // Remove extra extension

    // Ensure only one extension in filename
    const filename = `${Date.now()}-${baseName}${fileExtension}`;

    console.log("Saved file as:", filename);
    cb(null, filename);
  },
});

const project_upload = multer({
  storage: projectstorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
}).single("attachment");

adminRoute.post(
  "/createproject",
  Admin.authMiddleware,
  project_upload,
  Project.createProject
);
adminRoute.put(
  "/updateProject",
  Admin.authMiddleware,
  project_upload,
  Project.updateProject
);

adminRoute.get(
  "/get_project_document/:fileName",
  Admin.authMiddleware,
  Project.getFile
);

adminRoute.post(
  "/getAllProjects",
  Admin.authMiddleware,
  Project.getAllProjectsPagination
);

adminRoute.delete(
  "/deleteProject/:id",
  Admin.authMiddleware,
  Project.deleteProject
);
adminRoute.post(
  "/getProjectById/:id",
  Admin.authMiddleware,
  Project.getProjectById
);
// adminRoute.post("/getProjectByStatus", Project.getProjectByStatus);
adminRoute.get(
  "/getAllProjectList",
  Admin.authMiddleware,
  Project.getAllProject
);
adminRoute.post(
  "/getTaskRelatedToProject",
  Admin.authMiddleware,
  Task.getTaskRelatedToProject
);
adminRoute.post(
  "/getMilestonesForProject",
  Admin.authMiddleware,
  Milestone.getMilestonesForConsentProjects
);

adminRoute.delete(
  "/del_daliyTask",
  Admin.authMiddleware,
  Task.DeleteDailyTaskUpdate
);

// Route to calculate project progress by projectId
adminRoute.get(
  "/hours_spent_progress",
  Admin.authMiddleware,
  Project.calculateProjectProgress
);

//Tickets routes

// Set up multer storage to control the destination and filename
const Ticketstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure the uploads folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Keep original file name with timestamp
  },
});

// Initialize multer with the storage configuration
const ticket_upload = multer({
  storage: Ticketstorage, // Use the custom storage config
  limits: { fileSize: 10 * 1024 * 1024 }, // File size limit (10 MB)
});

// Update route: Ensure it correctly handles file uploads
adminRoute.post(
  "/updateTicket",
  Admin.authMiddleware,
  ticket_upload.single("attachments"),
  Ticket.updateTicket
);

// userRoute.post("/createTicket", User.authMiddleware, Ticket.createTicket);
adminRoute.post(
  "/createTicket",
  Admin.authMiddleware,
  ticket_upload.single("attachments"),
  Ticket.createTicket
);

// Get all tickets with project and assigned employee details
adminRoute.get(
  "/getall_ticket",
  Admin.authMiddleware,
  Ticket.getTicketsWithDetails
);

// Get a ticket by ID
adminRoute.get("/tickets/:id", Admin.authMiddleware, Ticket.getTicketById);

// // Update a ticket

adminRoute.post(
  "/updatetickstatus",
  Admin.authMiddleware,
  Ticket.updateTicketStatus
);

// Delete a ticket
adminRoute.delete(
  "/deleteTickets/:id",
  Admin.authMiddleware,
  Ticket.deleteTicket
);
adminRoute.get("/get_ticket_document/:fileName", Ticket.getFile);

//Tasks routes

// Update UAT Status route (to be called when a user marks the task for UAT)
adminRoute.patch(
  "/updateUATStatus",
  Admin.authMiddleware,
  Task.updateUATStatus
);
// Route to get UAT tasks for testers
adminRoute.get("/tasks_uat", User.authMiddleware, Task.listUATTasksForTesters);

// Update Tester Approval route (tester can approve or reject the task)
adminRoute.patch(
  "/updateTesterApproval",
  Admin.authMiddleware,
  Task.updateTesterApproval
);

//document routes

// Set up multer storage to control the destination and filename
const documentstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Ensure the uploads folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Keep original file name with timestamp
  },
});

// Initialize multer with the storage configuration
const document_upload = multer({
  storage: documentstorage, // Use the custom storage config
  limits: { fileSize: 10 * 1024 * 1024 }, // File size limit (10 MB)
});

// Route to upload a file
adminRoute.post(
  "/upload",
  Admin.authMiddleware,
  document_upload.single("file"),
  document.uploadFile
);

// Route to get all files
adminRoute.get("/getAllfiles", Admin.authMiddleware, document.getAllFiles);

// Route to get a single file by ID
adminRoute.get("/file/:id", Admin.authMiddleware, document.getAllFiles);

adminRoute.delete(
  "/deletefiles/:id",
  Admin.authMiddleware,
  document.deleteFile
);
adminRoute.get("/uploads/:fileName", Admin.authMiddleware, document.getFile);

export default adminRoute;
