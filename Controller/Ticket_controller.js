import { Ticket } from "../Model/Ticket_schema.js";
import mongoose from "mongoose"; // Add this import statement at the top of your file
import fs from "fs";
import path from "path";
import ProjectModel from "../Model/Project_schema.js"; // Use named import
// import { TaskModel } from '../Model/Task_scheme.js'
import { fileURLToPath } from "url";
import mime from "mime-types";

// export const createTicket = async (req, res) => {
//   const {
//     title,
//     description,
//     project,
//     assigned_to,
//     tasks,
//     priority,
//     status,
//     severity,
//     main_category,
//     sub_category,
//   } = req.body;

//   console.log("value", req.body);

//   try {
//     console.log(req.user);

//     // Authorization Check
//     if (req.user.department !== "testing" && req.user.role !== "admin") {
//       return res.status(403).json({
//         status: false,
//         message:
//           "Access denied. Only users from the testing department or admins are authorized.",
//       });
//     }

//     // Validation for required fields
//     if (!main_category || !sub_category) {
//       return res.status(400).json({
//         status: false,
//         message: "Main category and Sub category are required.",
//       });
//     }

//     if (!title || !description || !project) {
//       return res.status(400).json({
//         status: false,
//         message: "Title, Description, and Project are required.",
//       });
//     }

//     // Check if project exists
//     const projectExists = await ProjectModel.findById(project);
//     if (!projectExists) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Project not found." });
//     }

//     let taskId = null;
//     if (tasks) {
//       if (!mongoose.Types.ObjectId.isValid(tasks)) {
//         return res
//           .status(400)
//           .json({ status: false, message: "Invalid task ID." });
//       }
//       taskId = new mongoose.Types.ObjectId(tasks);
//     }

//     // // Validate status for testers
//     // if (req.user.department === "testing") {
//     //   const testerAllowedStatuses = ["Open", "Closed", "Reopen"];
//     //   if (!status || !testerAllowedStatuses.includes(status)) {
//     //     return res.status(400).json({
//     //       status: false,
//     //       message: `Testers can only set the status to: ${testerAllowedStatuses.join(
//     //         ", "
//     //       )}`,
//     //     });
//     //   }
//     // }

//     // Validate status for testers
//     if (req.user.department === "testing" && !["Open", "Closed", "Reopen"].includes(status)) {
//       return res.status(400).json({
//         status: false,
//         message: `Testers can only set the status to: Open, Closed, Reopen`,
//       });
//     }

//     // Admins can change any status
//     if (req.user.role === "admin" && !status) {
//       return res.status(400).json({
//         status: false,
//         message: "Status is required for admin users",
//       });
//     }

//     // Handle file attachments
//     let attachments = [];
//     if (req.files && req.files.length > 0) {
//       attachments = req.files.map((file) => ({
//         file_name: file.originalname, // Fetch the original file name
//         file_url: `/uploads/${file.filename}`, // Store the file path
//         uploaded_at: new Date(),
//       }));
//     }

//     // Create a new ticket
//     const ticket = new Ticket({
//       title,
//       description,
//       project,
//       assigned_to,
//       priority,
//       tasks,
//       status,
//       severity,
//       main_category,
//       sub_category,
//       raised_by: req.user.id,
//       attachments,
//     });

//     // Save ticket to database
//     await ticket.save();

//     res.status(201).json({
//       status: true,

//       message: "Ticket created successfully",
//       ticket,
//     });
//   } catch (error) {
//     console.error("Error creating ticket:", error);
//     res.status(500).json({
//       status: false,
//       message: "An error occurred while creating the ticket.",
//       error: error.message,
//     });
//   }
// };

export const createTicket = async (req, res) => {
  try {
    // Authorization Check
    if (req.user.department !== "testing" && req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message:
          "Access denied. Only users from the testing department or admins are authorized.",
      });
    }

    // Extract ticket fields from the request body (except raised_by)
    const {
      title,
      description,
      project,
      tasks,
      assigned_to,
      priority,
      status,
      severity,
      main_category,
      sub_category,
      start_date,
    end_date,
    } = req.body;

    // Validation for required fields
    if (!main_category || !sub_category) {
      return res.status(400).json({
        status: false,
        message: "Main category and Sub category are required.",
      });
    }

    if (!title || !description || !project) {
      return res.status(400).json({
        status: false,
        message: "Title, Description, and Project are required.",
      });
    }

    // Check if project exists
    const projectExists = await ProjectModel.findById(project);
    if (!projectExists) {
      return res
        .status(404)
        .json({ status: false, message: "Project not found." });
    }

    // Validate and process task ID if provided
    let taskId = null;
    if (tasks) {
      if (!mongoose.Types.ObjectId.isValid(tasks)) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid task ID." });
      }
      taskId = new mongoose.Types.ObjectId(tasks);
    }

    // Validate status for testers
    if (
      req.user.department === "testing" &&
      status &&
      !["Open", "Closed", "Reopen"].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Testers can only set the status to: Open, Closed, Reopen",
      });
    }

    // Admins must provide a status
    if (req.user.role === "admin" && !status) {
      return res.status(400).json({
        status: false,
        message: "Status is required for admin users",
      });
    }

    // // Build the attachments object from the uploaded file (if any)
    // let attachments = {};
    // if (req.file) {
    //   attachments = {
    //     file_name: req.file.originalname, // Original file name
    //     file_url: req.file.path,          // File path (or URL if using cloud storage)

    //     // uploaded_at: Date.now(),
    //   };
    // }

    // Build the attachments object from the uploaded file (if any)
    let attachments = {};
    const timestamp = Date.now();
    const originalFileName = req.file.originalname;
    const newFileName = `${timestamp}-${originalFileName}`;
    const uploadDir = path.join(__dirname, "../uploads");

    // ✅ Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const newFilePath = path.join(uploadDir, newFileName);

    fs.renameSync(req.file.path, newFilePath);

    // const file_url = `/uploads/${newFileName}`;
    if (req.file) {
      attachments = {
        file_name: req.file.originalname,
        file_url: `/uploads/${newFileName}`, // Use `newFileName` instead of `req.file.filename`
        uploaded_at: Date.now(),
      };
    }

    console.log("Attachments:", attachments);

    // let attachments = {};
    // if (req.file) {
    //   attachments = {
    //     file_name: req.file.originalname,
    //     file_url: `/uploads/${req.file.filename}`,
    //      uploaded_at: Date.now(),
    //   };
    // }

    // Create a new ticket instance
    const newTicket = new Ticket({
      title,
      description,
      project,
      tasks: taskId, // Use validated task ID (or null)
      raised_by: req.user.id, // Automatically set raised_by to the logged-in user's id
      assigned_to: assigned_to, // Ensure null is stored if not provided
      priority,
      status,
      severity,
      main_category,
      sub_category,
      start_date,
    end_date,
      attachments, // Single attachment document (not an array)
    });

    console.log("New Ticket:", newTicket);
    // Save the ticket to the database
    await newTicket.save();

    // Respond with success and the newly created ticket
    return res.status(201).json({
      status: true,
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//return ticket to tester

// Assuming you already have the required imports for Ticket, User, etc.

export const updateTicketStatus = async (req, res) => {
  const { ticketId, status, description } = req.body;

  try {
    // Fetch the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ status: false, message: "Ticket not found" });
    }

    const user = req.user; // Logged-in user info
    const testerAllowedStatuses = ["Open", "Closed", "Reopen"];
    const userAllowedStatuses = ["In Progress", "Resolved"];

    // **Tester Role**
    if (req.user.department == "testing") {
      if (status && testerAllowedStatuses.includes(status)) {
        ticket.status = status;
      } else {
        return res.status(400).json({
          status: false,
          message: `Testers can only update the status to: ${testerAllowedStatuses.join(
            ", "
          )}`,
        });
      }
    }

    // **Other Users Role**
    else if (
      ["member", "team lead", "manager", "hr", "director", "admin"].includes(
        user.role
      )
    ) {
      if (status && userAllowedStatuses.includes(status)) {
        if (status === "Resolved") {
          if (!description) {
            return res.status(400).json({
              status: false,
              message: "Description is required when resolving a ticket.",
            });
          }
          ticket.description = description; // Set description when resolving
          ticket.assigned_to = ticket.raised_by; // Reassign to tester for verification
        }
        ticket.status = status;
      } else {
        return res.status(400).json({
          status: false,
          message: `You are only allowed to update the status to: ${userAllowedStatuses.join(
            ", "
          )}`,
        });
      }
    }

    // **Unauthorized Roles**
    else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to update the status of this ticket.",
      });
    }

    // Save the updated ticket
    ticket.updated_at = new Date();
    await ticket.save();

    // Success Response
    return res.status(200).json({
      status: true,
      message: `Ticket status updated to ${status}`,
      ticket,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      status: false,
      message: "Error updating ticket status",
      error: error.message,
    });
  }
};

export const getResolvedTickets = async (req, res) => {
  try {
    const user = req.user;

    console.log(user);

    // Check if the user is a project manager
    if (user.role !== "manager") {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view resolved tickets",
      });
    }

    // Fetch only resolved tickets related to the manager's project(s)
    const resolvedTickets = await Ticket.find({
      status: "Resolved",
      project: user.projectId, // Assuming projectId is stored in req.user
    }).populate("project tasks raised_by assigned_to"); // Populate references for better response

    return res.status(200).json({
      status: true,
      message: "Resolved tickets retrieved successfully",
      data: resolvedTickets,
    });
  } catch (error) {
    console.error("Error fetching resolved tickets:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching resolved tickets",
      error: error.message,
    });
  }
};

//ishu corrected code//pagination

// export const getTicketsWithDetails = async (req, res) => {
//   try {
//     // console.log(req.query);

//     // Extract pagination parameters from the query
//     const { page = 1, limit = 10 } = req.query;
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     const sortBy = { createdAt: -1 };

//     // Initialize status summary with default values (0 for all statuses)
//     const initialStatusSummary = {
//       Open: 0,
//       "In Progress": 0,
//       Resolved: 0,
//       Closed: 0,
//       Reopen: 0,
//     };

//     // Count tickets by status using aggregation
//     const statusCounts = await Ticket.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//     ]);

//     // Merge the aggregation results into the initialStatusSummary
//     const statusSummary = statusCounts.reduce((acc, item) => {
//       acc[item._id] = item.count;
//       return acc;
//     }, initialStatusSummary);

//     // Calculate total tickets
//     const totalTickets = await Ticket.countDocuments();

//     // Check if the user has 'admin' or 'tester' role
//     if (req.user.department !== "testing" && req.user.role !== "admin") {
//       // If not admin or tester, show only tickets assigned to this user
//       const tickets = await Ticket.find({ assigned_to: req.user.id })
//         .sort(sortBy)
//         .skip((pageNumber - 1) * limitNumber)
//         .limit(limitNumber)
//         .populate("project", "name description") // Populate project details
//         .populate("assigned_to", "name mail") // Populate assigned employee details
//         .populate("raised_by", "name email") // Assuming 'name' and 'email' are in your User model
//         .populate("tasks", "task_title");

//       // Count total tickets for this user
//       const userTotalTickets = await Ticket.countDocuments({
//         assigned_to: req.user.id,
//       });

//       // If no tickets are found for this user, send a message
//       if (!tickets || tickets.length === 0) {
//         return res
//           .status(404)
//           .json({ status: false, message: "No tickets found for this user" });
//       }

//       return res.status(200).json({
//         message: "Tickets fetched successfully for this user",
//         data: {
//           tickets,
//           total: userTotalTickets,
//           pagination: {
//             currentPage: pageNumber,
//             totalPages: Math.ceil(userTotalTickets / limitNumber),
//           },
//           statusSummary,
//           totalTickets,
//         },
//       });
//     }

//     // If admin or tester, show all tickets
//     const tickets = await Ticket.find()
//       .sort(sortBy)
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber)
//       .populate("project", "name description") // Populate project details
//       .populate("assigned_to", "name mail") // Populate assigned employee details
//       .populate("raised_by", "name email") // Assuming 'name' and 'email' are in your User model
//       .populate("tasks", "task_title"); // Populate assigned employee details

//     if (!tickets || tickets.length === 0) {
//       return res
//         .status(404)
//         .json({ status: false, message: "No tickets found" });
//     }

//     res.status(200).json({
//       message: "Tickets fetched successfully",
//       data: {
//         tickets,
//         total: totalTickets,
//         pagination: {
//           currentPage: pageNumber,
//           totalPages: Math.ceil(totalTickets / limitNumber),
//         },
//         statusSummary,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ message: "Error fetching tickets", error: error.message });
//   }
// };

export const getTicketsWithDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = "" } = req.query;
    console.log("Request Query:", req.query);
    const { role, id: userId, department } = req.user;

    // Initialize filters
    const filter = {};

    // Role-based filtering
    if (department !== "testing" && role !== "admin") {
      filter.assigned_to = userId;
    }

    // Status filtering
    const validStatuses = [
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
      "Reopen",
    ];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: false,
          message: `Invalid status provided. Valid statuses are: ${validStatuses.join(
            ", "
          )}`,
        });
      }
      filter.status = status;
    }

    // Search filtering
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    // Parse and validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));

    // Fetch tickets and count asynchronously
    // const [tickets, totalTickets, allTickets] = await Promise.all([
    //   Ticket.find(filter)
    //     .populate("project", "name description")
    //     .populate("assigned_to", "name mail")
    //     .populate("raised_by", "name email")
    //     .populate("tasks", "task_title")
    //     .sort({ createdAt: -1 })
    //     .skip((pageNumber - 1) * limitNumber)
    //     .limit(limitNumber)
    //     .lean(),
    //   Ticket.countDocuments(filter),
    //   Ticket.find().lean(),
    // ]);

    // Fetch tickets and count asynchronously
    const [tickets, totalTickets, userTickets] = await Promise.all([
      Ticket.find(filter)
        .populate("project", "name description")
        .populate("assigned_to", "name mail")
        .populate("raised_by", "name email")
        .populate("tasks", "task_title")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      Ticket.countDocuments(filter),
      Ticket.find({
        $or: [{ assigned_to: userId }, { raised_by: userId }],
      }).lean(), // Fetch only the logged-in user's tickets
    ]);

    // Calculate status summary
    const statusSummary = validStatuses.reduce((summary, status) => {
      summary[status] = 0; // Initialize with 0
      return summary;
    }, {});

    userTickets.forEach((ticket) => {
      if (statusSummary[ticket.status] !== undefined) {
        statusSummary[ticket.status]++;
      }
    });

    // Return response
    return res.status(200).json({
      status: true,
      data: {
        total: totalTickets,
        statusSummary,
        tickets,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTickets / limitNumber),
        },
      },
      message: "Tickets fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching tickets",
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the ticket, populate project and assigned_to
    const ticket = await Ticket.findById(id)
      .populate("project", "project_name project_description") // Assuming 'project_name' and 'project_description' are the fields in your Project model
      .populate("assigned_to", "name mail") // Assuming 'name' and 'email' are in your User model
      .populate("raised_by", "name email") // Assuming 'name' and 'email' are in your User model
      .populate("tasks", "task_title"); // Assuming 'name' and 'email' are in your User model

    // If no ticket is found
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Fix the file URL only if attachments exist
    // if (ticket.attachments && ticket.attachments.file_url) {
    //   ticket.attachments.file_url = `${req.protocol}://${req.get(
    //     "host"
    //   )}/uploads/${path.basename(ticket.attachments.file_url)}`;
    // }
    if (ticket.attachments && ticket.attachments.file_url) {
      ticket.attachments.file_url = `${path.basename(
        ticket.attachments.file_url
      )}`;
    }

    // Return the ticket details
    res.status(200).json({
      status: true,
      message: "Ticket found successfully",
      data: ticket,
    });
  } catch (error) {
    // Handle errors
    res
      .status(500)
      .json({ message: "Error fetching ticket", error: error.message });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getFile = async (req, res) => {
  try {
    const { fileName } = req.params; // Use filename from URL
    console.log("asd", fileName);
    const filePath = path.join(__dirname, "../uploads", fileName);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    // res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Type", contentType);
    // console.log('object', contentType)

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTicket = await Ticket.findByIdAndDelete(id);

    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting ticket", error: error.message });
  }
};

// export const updateTicket = async (req, res) => {
//   try {
//     const { id, title, description, tasks, project, assigned_to, priority, status, severity, main_category, sub_category } = req.body;

//     console.log("Request Body:", req.body);

//     // Validate ID format
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ status: false, message: "Invalid Ticket ID" });
//     }

//     // Find the existing ticket
//     const ticket = await Ticket.findById(id);
//     if (!ticket) {
//       return res.status(404).json({ status: false, message: "Ticket not found" });
//     }

//     // Authorization check (Only Admin or Testing team)
//     if (!(req.user.role === "admin" || req.user.department === "testing")) {
//       return res.status(403).json({ status: false, message: "No Authorization to update ticket" });
//     }

//     const updates = {};
//     if (title) updates.title = title;
//     if (description) updates.description = description;
//     if (project) updates.project = project;
//     if (tasks) updates.tasks = tasks;
//     if (assigned_to) updates.assigned_to = assigned_to;
//     if (priority) updates.priority = priority;
//     if (severity) updates.severity = severity;
//     if (main_category) updates.main_category = main_category;
//     if (sub_category) updates.sub_category = sub_category;

//     // Enforce status update restrictions
//     if (status) {
//       const allowedStatusesForTesting = ["Open", "Closed", "Reopen"];

//       if (req.user.department === "testing" && !allowedStatusesForTesting.includes(status)) {
//         return res.status(403).json({
//           status: false,
//           message: "Testing team can only change status to 'Open', 'Closed', or 'Reopen'",
//         });
//       }

//       updates.status = status; // Admin can update to any status
//     }

//     // Handle file attachments
//     if (req.files && req.files.length > 0) {
//       const uploadedFiles = req.files.map(file => ({
//         file_name: file.originalname,
//         file_url: `/uploads/${file.filename}`,
//         uploaded_at: new Date(),
//       }));
//       updates.attachments = [...ticket.attachments, ...uploadedFiles]; // Append new files
//     }

//     // Update `updated_at` timestamp
//     updates.updated_at = new Date();

//     // Update the ticket
//     const updatedTicket = await Ticket.findByIdAndUpdate(id, updates, { new: true });

//     return res.status(200).json({
//       status: true,
//       message: "Ticket updated successfully",
//       ticket: updatedTicket,
//     });
//   } catch (error) {
//     console.error("Error updating ticket:", error);
//     res.status(500).json({ status: false, message: "Error updating ticket", error: error.message });
//   }
// };

export const updateTicket = async (req, res) => {
  try {
    const {
      _id,
      title,
      description,
      tasks,
      project,
      assigned_to,
      priority,
      status,
      severity,
      main_category,
      sub_category,
      start_date,
    end_date,
    } = req.body;

    console.log("Request Body:", req.body);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid Ticket ID" });
    }

    // Find the existing ticket
    const ticket = await Ticket.findById(_id);
    if (!ticket) {
      return res
        .status(404)
        .json({ status: false, message: "Ticket not found" });
    }

    // Authorization check (Only Admin or Testing team)
    if (!(req.user.role === "admin" || req.user.department === "testing")) {
      return res
        .status(403)
        .json({ status: false, message: "No Authorization to update ticket" });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (project) updates.project = project;
    if (tasks) updates.tasks = tasks;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (priority) updates.priority = priority;
    if (severity) updates.severity = severity;
    if (main_category) updates.main_category = main_category;
    if (sub_category) updates.sub_category = sub_category;
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;

    // Enforce status update restrictions
    if (status) {
      const allowedStatusesForTesting = ["Open", "Closed", "Reopen"];

      if (
        req.user.department === "testing" &&
        !allowedStatusesForTesting.includes(status)
      ) {
        return res.status(403).json({
          status: false,
          message:
            "Testing team can only change status to 'Open', 'Closed', or 'Reopen'",
        });
      }

      updates.status = status; // Admin can update to any status
    }

    // Handle file attachment (Single document)
    if (req.file) {
      // Corrected from req.files to req.file
      updates.attachments = {
        file_name: req.file.originalname,
        file_url: `/uploads/${req.file.filename}`, // Correct filename reference
        uploaded_at: new Date(),
      };
    }

    // Update `updated_at` timestamp
    updates.updated_at = new Date();

    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(_id, updates, {
      new: true,
    });

    return res.status(200).json({
      status: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      status: false,
      message: "Error updating ticket",
      error: error.message,
    });
  }
};
