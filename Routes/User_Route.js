import express from "express";
import * as User from "../Controller/User_Controller.js";
import * as Admin from "../Controller/Admin_controller.js";
import * as Ticket from "../Controller/Ticket_controller.js";
import * as Task from "../Controller/Task_Controller.js";
import * as Project from "../Controller/Project_controller.js";
import * as Milestone from "../Controller/Milestone_controller.js";
import path from "path";

import multer from "multer";

import * as document from "../Controller/document_controller.js";

const userRoute = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

userRoute.post("/login", User.user_login);

userRoute.post("/create", User.createUser);

// userRoute.post("/verify/:userId", User.authMiddleware,verifyUserByAdmin);
userRoute.post("/approveHr", User.authMiddleware, User.approveUserByHR);

// hr,manager,team lead,employee - dashbroad
userRoute.post("/dashboard", User.authMiddleware, User.user_dashboard);

// userRoute.post("/update",createUser);
userRoute.post("/getAllEmployee", User.authMiddleware, User.getAllEmployee);
userRoute.post("/createTask", User.authMiddleware, Task.createTask);
userRoute.get("/getAllTask", User.authMiddleware, Task.getAllTask);
userRoute.post("/editStatus", Task.editTaskStatus);
userRoute.post("/daliyTaskUpdate", User.authMiddleware, Task.DailyTaskUpdate);

// userRoute.post("/",User.authMiddleware,Task.create_skill_Improvement);

userRoute.post(
  "/getDepartmentWiseEmployee",
  User.authMiddleware,
  User.getEmployeesByDepartment
);
userRoute.post("/getTaskByEmployee",User.authMiddleware,Task.getTaskByEmployee);
userRoute.get("/exportXLSX", User.exportXLSX);
// userRoute.post("/profie", View_profile);
userRoute.get("/getEmpMails", User.authMiddleware, User.getAllUserEmpMail);
userRoute.post("/importXLSX", upload.single("file"), User.importXLSX);

//Tickets routes

// Set up multer storage to control the destination and filename
const Ticketstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Ensure the uploads folder exists
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
userRoute.post(
  "/updateTicket",
  User.authMiddleware,
  ticket_upload.single("attachments"),
  Ticket.updateTicket
);

// userRoute.post("/createTicket", User.authMiddleware, Ticket.createTicket);
userRoute.post(
  "/createTicket",
  User.authMiddleware,
  ticket_upload.single("attachments"),
  Ticket.createTicket
);

userRoute.post("/deleteTicket", Ticket.deleteTicket);

const projectstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const project_upload = multer({
  storage: projectstorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("attachment");

userRoute.post(
  "/createproject",
  User.authMiddleware,
  project_upload,
  Project.createProject
);
userRoute.put(
  "/updateProject",
  User.authMiddleware,
  project_upload,
  Project.updateProject
);
userRoute.get(
  "/get_project_document/:fileName",
  User.authMiddleware,
  Project.getFile
);

userRoute.post(
  "/getAllProjects",
  User.authMiddleware,
  Project.getAllProjectsPagination
);
userRoute.get("/getAllProjectList", User.authMiddleware, Project.getAllProject);
userRoute.post(
  "/getMilestonesForProject",
  User.authMiddleware,
  Milestone.getMilestonesForConsentProjects
);

// Route to calculate project progress by projectId
userRoute.get(
  "/hours_spent_progress",
  User.authMiddleware,
  Project.calculateProjectProgress
);

//Ticket Routes

// Get all tickets with project and assigned employee details
userRoute.get(
  "/getall_ticket",
  User.authMiddleware,
  Ticket.getTicketsWithDetails
);

// Get a ticket by ID
userRoute.get("/tickets/:id", User.authMiddleware, Ticket.getTicketById);

userRoute.post(
  "/updatetickstatus",
  User.authMiddleware,
  Ticket.updateTicketStatus
);

// Route for getting resolved tickets (Manager only)
userRoute.get(
  "/resolved-tickets",
  User.authMiddleware,
  Ticket.getResolvedTickets
);

// Delete a ticket
userRoute.delete("/tickets/:id", User.authMiddleware, Ticket.deleteTicket);

// Update UAT Status route (to be called when a user marks the task for UAT)
userRoute.post("/updateUATStatus", User.authMiddleware, Task.updateUATStatus);

// Route to get UAT tasks for testers
userRoute.get("/tasks_uat", User.authMiddleware, Task.listUATTasksForTesters);

// Update Tester Approval route (tester can approve or reject the task)
userRoute.post(
  "/updateTesterApproval",
  User.authMiddleware,
  Task.updateTesterApproval
);

// Multer storage config
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Route to upload a single file
userRoute.post(
  "/upload_document",
  User.authMiddleware,
  documentUpload.single("file"),
  document.uploadFile
);

// Route to update a file
// userRoute.put(  "/update/:fileId",  User.authMiddleware,  documentUpload.single("file"),  document.updateFile);

// Route to delete a file
userRoute.delete("/delete/:id", User.authMiddleware, document.deleteFile);

userRoute.get("/getAllfiles", User.authMiddleware, document.getAllFiles);
userRoute.get("/uploads/:fileName", User.authMiddleware, document.getFile);

// // Route to get all files
// userRoute.get("/getAllfiles", User.authMiddleware,document.getAllFiles);

// // Route to get a single file by ID
// userRoute.get("/file/:id", User.authMiddleware,document.getFileById);

// userRoute.delete('/deletefiles/:id', User.authMiddleware,document.deleteFiles);

export default userRoute;
