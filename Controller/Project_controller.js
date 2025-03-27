import ProjectModel from "../Model/Project_schema.js";
import { TaskModel } from "../Model/Task_scheme.js";
import MilestoneModel from "../Model/Milestone_schema.js";

import { fetchProjectDetails } from "../Helper function/projectHelper.js";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create a new project
//updated the details and to check git

// export const createProject = async (req, res) => {
//   const {
//     project_name,
//     project_description,
//     project_ownership,
//     startDate,
//     endDate,
//     project_status,
//     estimated_hours,
//     milestones,
//   } = req.body;

//   const { role } = req.user;
//   const estimatedHours = parseInt(estimated_hours, 10);

//   // Authorization check
//   if (role !== "admin" && role !== "manager") {
//     return res.status(403).json({
//       status: false,
//       message: "No authorization to create a project",
//     });
//   }

//   // Validation
//   if (
//     !project_name ||
//     typeof project_name !== "string" ||
//     project_name.trim() === ""
//   ) {
//     return res.status(400).json({
//       status: false,
//       message: "Project name is required and must be a valid string.",
//     });
//   }

//   if (startDate && isNaN(Date.parse(startDate))) {
//     return res.status(400).json({
//       status: false,
//       message: "Invalid start date format.",
//     });
//   }

//   if (endDate && isNaN(Date.parse(endDate))) {
//     return res.status(400).json({
//       status: false,
//       message: "Invalid end date format.",
//     });
//   }

//   if (!estimated_hours || isNaN(estimatedHours) || estimatedHours <= 0) {
//     return res.status(400).json({
//       status: false,
//       message: "Estimated hours are required and must be a positive number.",
//     });
//   }

//   if (milestones && !Array.isArray(milestones)) {
//     return res.status(400).json({
//       status: false,
//       message: "Milestones must be an array.",
//     });
//   }

//       project_name,
//       project_description,
//       project_ownership,
//       startDate,
//       endDate,
//       project_status,
//       estimated_hours: estimatedHours,

//     const project = await newProject.save();

//       const milestoneDocuments = milestones.map((milestoneName) => ({
//         name: milestoneName,
//         project: project._id,
//       }));

//       // Update project with milestone references
//       project.milestones = createdMilestones.map((milestone) => milestone._id);
//       await project.save();
//     }

//     return res.status(201).json({
//       status: true,
//       message: "Project and milestones created successfully",
//       data: project,
//     });
//   } catch (error) {
//     console.error("Error creating project and milestones:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while creating the project and milestones",
//     });
//   }
// };

//now correct code
// export const createProject = async (req, res) => {
//   try {
//     const {
//       project_name,
//       project_description,
//       project_ownership,
//       startDate,
//       endDate,
//       project_status,
//       estimated_hours,
//       milestones, // This might be a string
//     } = req.body;

//     const { role } = req.user;
//     const estimatedHours = parseInt(estimated_hours, 10);

//     // Convert milestones from string to array if needed
//     let milestoneList = milestones;
//     if (typeof milestones === "string") {
//       try {
//         milestoneList = JSON.parse(milestones);
//       } catch (error) {
//         return res.status(400).json({
//           status: false,
//           message: "Milestones must be an array of names.",
//         });
//       }
//     }

//     if (milestoneList && !Array.isArray(milestoneList)) {
//       return res.status(400).json({
//         status: false,
//         message: "Milestones must be an array of names.",
//       });
//     }

//     // Create a new project
//     const newProject = new ProjectModel({
//       project_name,
//       project_description,
//       project_ownership,
//       startDate,
//       endDate,
//       project_status,
//       estimated_hours: estimatedHours,
//     });

//     const project = await newProject.save();

//     // If milestones exist, create them
//     if (milestoneList && milestoneList.length > 0) {
//       const milestoneDocuments = milestoneList.map((name) => ({
//         name,
//         project: project._id,
//       }));

//       const createdMilestones = await MilestoneModel.insertMany(milestoneDocuments);

//       project.milestones = createdMilestones.map((m) => m._id);
//       await project.save();
//     }

//     return res.status(201).json({
//       status: true,
//       message: "Project and milestones created successfully",
//       data: project,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while creating the project and milestones",
//     });
//   }
// };

export const createProject = async (req, res) => {
  try {
    const {
      project_name,
      project_description,
      project_ownership,
      startDate,
      endDate,
      project_status,
      estimated_hours,
      milestones, // This might be a string
    } = req.body;

    const { role } = req.user;
    const estimatedHours = parseInt(estimated_hours, 10);

    // Convert milestones from string to array if needed
    let milestoneList = milestones;
    if (typeof milestones === "string") {
      try {
        milestoneList = JSON.parse(milestones);
      } catch (error) {
        return res.status(400).json({
          status: false,
          message: "Milestones must be an array of names.",
        });
      }
    }

    if (milestoneList && !Array.isArray(milestoneList)) {
      return res.status(400).json({
        status: false,
        message: "Milestones must be an array of names.",
      });
    }

    // Handle file attachment
    let attachment = null;
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

    if (req.file) {
      attachment = {
        file_name: req.file.originalname,
        file_url: `${newFileName}`,
        uploaded_at: new Date(),
      };

      console.log("Saved file:", req.file);
    }

    // Create a new project
    const newProject = new ProjectModel({
      project_name,
      project_description,
      project_ownership,
      startDate,
      endDate,
      project_status,
      estimated_hours: estimatedHours,
      attachments: attachment, // Add the file attachment
    });

    const project = await newProject.save();

    // If milestones exist, create them
    if (milestoneList && milestoneList.length > 0) {
      const milestoneDocuments = milestoneList.map((name) => ({
        name,
        project: project._id,
      }));

      const createdMilestones = await MilestoneModel.insertMany(
        milestoneDocuments
      );

      project.milestones = createdMilestones.map((m) => m._id);
      await project.save();
    }

    return res.status(201).json({
      status: true,
      message: "Project and milestones created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while creating the project and milestones",
    });
  }
};

export const calculateProjectProgress = async (req, res) => {
  const { projectId } = req.body;

  try {
    const { project, totalHoursSpent, error } = await fetchProjectDetails(
      projectId
    );

    if (error) {
      return res.status(404).json({ status: false, message: error });
    }

    // Calculate progress
    const estimatedHours = project.estimated_hours || 1; // Prevent division by zero
    const percentageSpent = (totalHoursSpent / estimatedHours) * 100;
    const remainingPercentage = 100 - percentageSpent;

    return res.status(200).json({
      status: true,
      message: "Project progress calculated successfully",
      data: {
        projectId,
        projectName: project.project_name,
        estimatedHours,
        totalHoursSpent,
        percentageSpent: percentageSpent.toFixed(2),
        remainingPercentage: remainingPercentage.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error calculating project progress:", error);
    return res.status(500).json({
      status: false,
      message: "Error calculating project progress",
    });
  }
};

// import { fetchProjectDetails } from "../Helper function/projectHelper.js";

export const getAllProject = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    // Default query
    let query = { is_deleted: false };

    // Modify query for managers
    if (role === "manager") {
      query = {
        is_deleted: false,
        $or: [
          { project_ownership: userId }, // Projects owned by the manager
          { assigned_managers: userId }, // (Optional) Projects the manager is assigned to
        ],
      };
    }

    console.log("Role:", role);
    console.log("Query:", query);

    // Fetch projects
    const projects = await ProjectModel.find(query)
      .select("_id project_name project_ownership milestones")
      .populate("project_ownership", "name mail")
      .populate("milestones", "name status");

    if (!projects.length) {
      return res.status(404).json({
        success: false,
        message: `No projects found for the role: ${role}. Query: ${JSON.stringify(
          query
        )}`,
      });
    }

    // Fetch additional project details
    const projectsWithDetails = [];
    for (const project of projects) {
      const {
        project: fullProject,
        tasks,
        totalHoursSpent,
      } = await fetchProjectDetails(project._id);
      projectsWithDetails.push({
        ...fullProject.toObject(),
        tasks,
        totalHoursSpent,
      });
    }

    return res.status(200).json({
      success: true,
      projects: projectsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//already correctly worked the code i will change the date 17/03

// export const getAllProjectsPagination = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status, search = "" } = req.query;
//     const { role, id: userId } = req.user;

//     // Initialize filters
//     const filter = { is_deleted: false };

//     // Role-based filtering
//     if (role === "manager" || role === "team lead") {
//       filter.project_ownership = userId;
//     }

//     // Status filtering
//     const validStatuses = [
//       "Completed",
//       "In Progress",
//       "Not Started",
//       "Pending",
//       "Cancelled",
//     ];
//     if (status) {
//       if (!validStatuses.includes(status)) {
//         return res.status(400).json({
//           status: false,
//           message: `Invalid status provided. Valid statuses are: ${validStatuses.join(
//             ", "
//           )}`,
//         });
//       }
//       filter.project_status = status;
//     }

//     // Search filtering
//     if (search.trim()) {
//       const searchRegex = new RegExp(search.trim(), "i");
//       filter.$or = [
//         { project_name: { $regex: searchRegex } },
//         { project_description: { $regex: searchRegex } },
//       ];
//     }

//     // Parse and validate pagination parameters
//     const pageNumber = Math.max(1, parseInt(page, 10));
//     const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));

//     // Fetch projects and count asynchronously
//     const [projects, totalProjects, allProjects] = await Promise.all([
//       ProjectModel.find(filter)
//         .populate("project_ownership", "name mail")
//         .populate("milestones", "name status developer_status tester_status")
//         .sort({ createdAt: -1 })
//         .skip((pageNumber - 1) * limitNumber)
//         .limit(limitNumber)
//         .lean(),
//       ProjectModel.countDocuments(filter),
//       ProjectModel.find({ is_deleted: false }).lean(),
//     ]);

//     console.log(await MilestoneModel.findOne({}, "name status developer_status tester_status"));

//     // Calculate status summary
//     const statusSummary = validStatuses.reduce((summary, status) => {
//       summary[status] = 0; // Initialize with 0
//       return summary;
//     }, {});

//     allProjects.forEach((project) => {
//       const projectStatus = project.project_status;
//       if (statusSummary[projectStatus] !== undefined) {
//         statusSummary[projectStatus]++;
//       }
//     });

//     // Fetch additional details for each project
//     const projectsWithDetails = [];
//     for (const project of projects) {
//       const {
//         project: fullProject,
//         tasks,
//         totalHoursSpent,
//       } = await fetchProjectDetails(project._id);
//       projectsWithDetails.push({
//         ...fullProject.toObject(),
//         tasks,
//         totalHoursSpent,
//       });
//     }

//     // Return response
//     return res.status(200).json({
//       status: true,
//       data: {
//         total: totalProjects,
//         statusSummary,
//         projects: projectsWithDetails,
//       },
//       message: "Projects fetched successfully",
//     });
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while fetching projects",
//     });
//   }
// };

export const getAllProjectsPagination = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = "" } = req.query;
    const { role, id: userId } = req.user;

    // Initialize filters
    const filter = { is_deleted: false };

    // Role-based filtering
    if (role === "manager" || role === "team lead") {
      filter.project_ownership = userId;
    }

    // Status filtering
    const validStatuses = [
      "Completed",
      "In Progress",
      "Not Started",
      "Pending",
      "Cancelled",
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
      filter.project_status = status;
    }

    // Search filtering
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { project_name: { $regex: searchRegex } },
        { project_description: { $regex: searchRegex } },
      ];
    }

    // Parse and validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));

    // Fetch all projects with milestone details
    const [projects, totalProjects, allProjects] = await Promise.all([
      ProjectModel.find(filter)
        .populate({
          path: "milestones",
          model: "Milestone",
          select: "name status developer_status tester_status",
        })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),

      ProjectModel.countDocuments(filter),
      ProjectModel.find({ is_deleted: false }).lean(),
    ]);

    console.log("Fetched Projects:", JSON.stringify(projects, null, 2));

    // const milestones = await MilestoneModel.find().lean();
    // console.log(milestones);
    // Calculate status summary
    const statusSummary = validStatuses.reduce((summary, status) => {
      summary[status] = 0;
      return summary;
    }, {});

    allProjects.forEach((project) => {
      const projectStatus = project.project_status;
      if (statusSummary[projectStatus] !== undefined) {
        statusSummary[projectStatus]++;
      }
    });

    // Fetch additional details for each project
    const projectsWithDetails = [];
    for (const project of projects) {
      const {
        project: fullProject,
        tasks,
        totalHoursSpent,
      } = await fetchProjectDetails(project._id);
      projectsWithDetails.push({
        ...fullProject.toObject(),
        tasks,
        totalHoursSpent,
      });
    }

    // Return response
    return res.status(200).json({
      status: true,
      data: {
        total: totalProjects,
        statusSummary,
        projects: projectsWithDetails,
      },
      message: "Projects fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching projects",
    });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  console.log(req.params);
  console.log(req.body);

  try {
    console.log(id);
    const project = await ProjectModel.findById(id)
      .populate("project_ownership", "name mail")
      .populate("milestones", "name status developer_status tester_status"); // Added tester_status

    if (!project || project.is_deleted) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project by ID:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching the project",
    });
  }
};

//fazil code
// export const getProjectById = async (req, res) => {
//   const { id } = req.params;
//   console.log(req.params);
//   console.log(req.body);
//   // Validate ObjectId
//   // if (!mongoose.Types.ObjectId.isValid(id)) {
//   //   return res.status(400).json({
//   //     status: false,
//   //     message: "Invalid project ID format",
//   //   });
//   // }

//   try {
//     // Fetch project with populated fields
//     console.log(id);
//     const project = await ProjectModel.findById(id)
//       .populate("project_ownership", "name mail")
//       .populate("milestones", "name status developer_status");

//     if (!project || project.is_deleted) {
//       return res.status(404).json({
//         status: false,
//         message: "Project not found",
//       });
//     }

//     return res.status(200).json({
//       status: true,
//       data: project,
//     });
//   } catch (error) {
//     console.error("Error fetching project by ID:", {
//       error: error.message,
//       stack: error.stack,
//     });
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while fetching the project",
//     });
//   }
// };

// Update a project

export const updateProject = async (req, res) => {
  const { _id, milestones, startDate, endDate, ...updateData } = req.body;
  const { role } = req.user;

  try {
    if (!["manager", "admin"].includes(role)) {
      return res.status(403).json({ error: "Access permissions Denied." });
    }

    let project = await ProjectModel.findById(_id).populate("milestones");
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Handle file upload (replace existing attachment)
    if (req.file) {
      project.attachments = {
        file_name: req.file.filename,
        file_url: `/uploads/${req.file.filename}`,
        uploaded_at: new Date(),
      };
    }

    if (startDate) {
      project.startDate = new Date(startDate);
    }
    if (endDate) {
      project.endDate = new Date(endDate);
    }

    // Handle milestones update (update existing & create new)
    if (milestones) {
      let milestoneList = milestones;

      if (typeof milestones === "string") {
        try {
          milestoneList = JSON.parse(milestones);
        } catch (error) {
          return res.status(400).json({
            status: false,
            message: "Milestones must be an array of objects (id, name).",
          });
        }
      }

      if (!Array.isArray(milestoneList)) {
        return res.status(400).json({
          status: false,
          message: "Milestones must be an array.",
        });
      }

      const updatedMilestones = [];
      const newMilestones = [];

      for (const milestone of milestoneList) {
        if (milestone._id) {
          // If milestone ID exists, update it
          await MilestoneModel.findByIdAndUpdate(milestone._id, {
            name: milestone.name,
            status: milestone.status,
          });
          updatedMilestones.push(milestone._id);
        } else {
          // If milestone ID is not provided, create a new milestone
          newMilestones.push({ name: milestone.name, project: project._id });
        }
      }

      // Insert new milestones and get their IDs
      if (newMilestones.length > 0) {
        const createdMilestones = await MilestoneModel.insertMany(
          newMilestones
        );
        updatedMilestones.push(...createdMilestones.map((m) => m._id));
      }

      // Update project milestones
      project.milestones = updatedMilestones;
    }

    // Apply other updates
    Object.assign(project, updateData);
    await project.save();

    const updatedProject = await ProjectModel.findById(_id).populate(
      "milestones"
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating project" });
  }
};

export const getFile = async (req, res) => {
  try {
    const { fileName } = req.params; // Use filename from URL
    console.log("asd", fileName);
    const filePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const updateProject = async (req, res) => {
//   const { _id, milestones, startDate, endDate, ...updateData } = req.body;
//   const { role } = req.user;

//   try {
//     if (!["manager", "admin"].includes(role)) {
//       return res.status(403).json({ error: "Access permissions Denied." });
//     }

//     let project = await ProjectModel.findById(_id).populate("milestones");
//     if (!project) {
//       return res.status(404).json({ error: "Project not found" });
//     }

//     // Handle file upload (replace existing attachment)
//     if (req.file) {
//       project.attachments = {
//         file_name: req.file.filename,
//         file_url: `/uploads/${req.file.filename}`,
//         uploaded_at: new Date(),
//       };
//     }

//     if (startDate) {
//       project.startDate = new Date(startDate);
//     }
//     if (endDate) {
//       project.endDate = new Date(endDate);
//     }

//     Object.assign(project, updateData);
//     await project.save();

//     const updatedProject = await ProjectModel.findById(_id).populate("milestones");

//     res.status(200).json({
//       success: true,
//       message: "Project updated successfully",
//       data: updatedProject,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error updating project" });
//   }
// };

// Soft delete a project
export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: { is_deleted: true } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while deleting the project",
    });
  }
};

export const getTaskRelatedToProject = async (req, res) => {
  const { projectId } = req.body;

  try {
    const tasks = await TaskModel.find({
      project: projectId,
      is_deleted: false,
    })
      .populate("project", "project_name") // Populate project details
      .populate("assigned_to", "name mail") // Populate assigned_to details
      .populate("assigned_by", "name mail") // Populate assigned_by details
      .populate("report_to", "name mail"); // Populate report_to details

    if (!tasks.length) {
      return res.status(404).json({
        status: false,
        message: "No tasks found for this project",
      });
    }
    const groupedTasks = tasks.reduce(
      (acc, task) => {
        if (task.status === "Completed") acc.completed.push(task);
        else if (task.status === "In Progress") acc.inProgress.push(task);
        else if (task.status === "Not Started") acc.notStarted.push(task);
        return acc;
      },
      { completed: [], inProgress: [], notStarted: [] }
    );

    return res.status(200).json({
      status: true,
      tasks,
      groupedTasks,
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching tasks",
    });
  }
};
