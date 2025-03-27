import { TaskModel } from "../Model/Task_scheme.js";
import { UserModel } from "../Model/User_scheme.js";
import ProjectModel from "../Model/Project_schema.js";
import MilestoneModel from "../Model/Milestone_schema.js"


export const createTask = async (req, res) => {
  const {
    project,
    assigned_to,
    assigned_by,
    report_to,
    status = "Not started",
    priority = "Low",
    start_date,
    end_date,
    task_description,
    task_title,
    milestone,
    move_to_uat = false, // New field with default value
    tester_approval = null, // New field with default value
  } = req.body;

  const { id, role } = req.user;
  console.log(req.body);

  // Check for required fields
  if (
    !project ||
    !assigned_to ||
    !report_to ||
    !start_date ||
    !end_date ||
    !task_description ||
    !task_title
  ) {
    return res.status(400).json({
      status: false,
      message: "Please provide all required fields for task creation",
    });
  }

  // Check for user role authorization
  if (role !== "admin" && role !== "team lead" && role !== "manager") {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    // Create new task object with the provided details
    const newTask = new TaskModel({
      project,
      assigned_to,
      assigned_by: id,
      report_to,
      status,
      priority,
      start_date,
      end_date,
      task_description,
      task_title,
      milestone, // Including the milestone reference
      move_to_uat, // Include the new field
      testerApproval: tester_approval, // Include the new field with standardized naming
    });

    // Save the task in the database
    const task = await newTask.save();

    // Return success response
    return res.status(201).json({
      status: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);

    // Handle errors during task creation
    return res.status(500).json({
      status: false,
      message: "Failure in task creation",
    });
  }
};


// ✅ Update task status & check if milestone should be updated
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Update task status
    task.status = status;
    await task.save();

    // ✅ Automatically update milestone status
    const milestone = await MilestoneModel.findById(task.milestone).populate("tasks");
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    // Check if all tasks are completed
    const allTasksCompleted = milestone.tasks.every(task => task.status === "Completed");
    milestone.developer_status = allTasksCompleted ? "Completed" : "In Progress";
    await milestone.save();

    res.json({ message: "Task updated & milestone status checked", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};




export const updateUATStatus = async (req, res) => {
  const { taskId, move_to_uat } = req.body; // Use taskId and move_to_uav from the body

  try {
    // Find the task by ID
    const task = await TaskModel.findById(taskId);

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Update the UAT status
    task.move_to_uat = move_to_uat;
    await task.save();

    return res.status(200).json({
      status: true,
      message: "UAT status updated successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Error in updating UAT status",
    });
  }
};





export const listUATTasksForTesters = async (req, res) => {
  try {
    // Extract user information from the request (assuming user info is in req.user)
    const { userId } = req.user; // Extract user ID from the auth middleware (or from headers)
    const user = await UserModel.findById(userId); // Fetch the user from the database

    // Check if the user is an admin or a tester
    if (req.user.role !== "admin" && req.user.department!== "testing") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only admins and testers can view this data.",
      });
    }

    // Fetch tasks with `move_to_uat: true` and `is_deleted: false`
    const tasks = await TaskModel.find({ move_to_uat: true, is_deleted: false })
      .populate("project", "project_name") // Populate project details
      .populate("assigned_to", "name email") // Populate assigned_to details
      .populate("assigned_by", "name email") // Populate assigned_by details
      .populate("report_to", "name email") // Populate report_to details
      .sort({ updatedAt: -1 }); // Sort by the most recently updated tasks

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No UAT tasks found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "All UAT tasks retrieved successfully.",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Error in retrieving UAT tasks.",
    });
  }
};




// // Update Tester Approval Function (Tester approves or rejects task)
export const updateTesterApproval = async (req, res) => {
  const { taskId } = req.body; // Get task ID from URL params
  const { tester_approval } = req.body; // Get tester approval status (true or false)

  const { userId } = req.user; // Extract user ID from the auth middleware (or from headers)
  const user = await UserModel.findById(userId); // Fetch the user from the database

  // Check if the user is an admin or a tester
  if (req.user.role !== "admin" && req.user.department!== "testing") {
    return res.status(403).json({
      status: false,
      message: "Access denied. Only admins and testers can view this data.",
    });
  }

  try {
    // Validate tester_approval value (must be a boolean)
    if (typeof tester_approval !== 'boolean') {
      return res.status(400).json({ status: false, message: "Invalid tester approval value. It must be either true or false." });
    }

    // Find the task by ID
    const task = await TaskModel.findById(taskId);

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Update the tester approval status
    task.tester_approval = tester_approval;

      // If the task is approved, update its status to "Completed"
      if (tester_approval === true) {
        task.status = "Completed";
      }

    await task.save();

    return res.status(200).json({
      status: true,
      message: "Tester approval updated successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Error in updating tester approval",
    });
  }
};

export const deleteTask = async (req, res) => {
  const { id, role } = req.body;
  console.log(req.body);
  if (role !== "admin") {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
  
    const task = await TaskModel.findOneAndDelete({ _id: id });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error deleting task" });
  }
};

export const editTaskStatus = async (req, res) => {
  const { _id, status } = req.body;

  if (!_id) {
    return res.status(400).json({ status: false, message: "Invalid Task ID" });
  }

  try {
    const result = await TaskModel.updateOne({ _id }, { $set: { status } });

    if (result.nModified === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found or not updated" });
    }

    return res.status(200).json({
      status: "Success",
      message: "Task status updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};



//correctly worked code
export const getAllTask = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = "" } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const userId = req.user.id; // ID of the logged-in user
    const userRole = req.user.role; // Role of the logged-in user (e.g., Manager, Team Lead, Member)
    const userDepartment = req.user.department; // Department of the logged-in user

    // Define the filter based on the role
    let filter = { is_deleted: false };

    if (userRole === "manager") {
      // Manager: Tasks they assigned or in projects they own
      const managerProjects = await ProjectModel.find({
        project_ownership: userId,
      }).select("_id");
      filter.$or = [
        { report_to: userId },
        { project: { $in: managerProjects } },
      ];
    } else if (userRole === "team lead") {
      // Team Lead: Tasks assigned to them or assigned by them
      filter.$or = [{ assigned_to: userId }, { assigned_by: userId }];
    } else if (userRole === "member") {
      // Team Member: Tasks directly assigned to them
      filter.assigned_to = userId;
    }

    // If the user is in the "testing" department, show UAT tasks
    if (userDepartment === "testing") {
      // Fetch tasks marked for UAT
      const uatTasks = await TaskModel.find({ move_to_uat: true, tester_approval: false,is_deleted: false })
        .populate("project", "project_name")
        .populate("assigned_to", "name email")
        .populate("assigned_by", "name email")
        .populate("report_to", "name email")
        .sort({ updatedAt: -1 });

      // If UAT tasks exist, add them to the response
      const uatStatusSummary = uatTasks.length > 0
        ? uatTasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          }, {})
        : {};

      return res.status(200).json({
        status: true,
        message: "Tasks retrieved successfully.",
        data: {
          uatTasks,
          uatStatusSummary,
        },
      });
    }

       

    // Handle valid statuses
    const validStatuses = [
      "Completed",
      "In progress",
      "Not started",
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
      filter.status = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { task_title: { $regex: searchRegex } },
        { task_description: { $regex: searchRegex } },
      ];
    }

    // Fetch tasks with pagination and populate references
    const tasks = await TaskModel.find(filter)
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate({
        path: "assigned_to",
        select: "name mail",
      })
      .populate({
        path: "assigned_by",
        select: "name mail",
      })
      .populate({
        path: "report_to",
        select: "name mail",
      })
      .populate({
        path: "milestone",
        select: "name status",
      })
      .populate({
        path: "project",
        select: "project_name",
      });

    // Count total tasks grouped by status
    const taskStatusCounts = await TaskModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status", // Group by status
          count: { $sum: 1 }, // Count the tasks in each group
        },
      },
    ]);

    

    // Transform the status counts into a key-value object
    // const statusSummary = {};
    // taskStatusCounts.forEach((status) => {
    //   statusSummary[status._id] = status.count;
    // });

    // Compute status summary
const statusSummary = tasks.reduce((acc, task) => {
  acc[task.status] = (acc[task.status] || 0) + 1;
  return acc;
}, {});

      // Count total tasks for pagination
    const totalTasks = await TaskModel.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Tasks fetched successfully",
      data: {
        total: totalTasks,
        statusSummary, // Include the total count of tasks grouped by status
        tasks,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTasks / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error(`[getAllTask]: Error fetching tasks - ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching tasks",
    });
  }
};


// export const getAllTask = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status, search = "" } = req.query;

//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     const userId = req.user.id;
//     const userRole = req.user.role;
//     const userDepartment = req.user.department;

//     let filter = { is_deleted: false };

//     if (userRole === "tester") {
//       // Fetch tasks only related to milestones assigned to the tester
//       const testerMilestones = await MilestoneModel.find({
//         assigned_to: userId,
//       }).select("_id");

//       filter.milestone = { $in: testerMilestones };
//     } else if (userRole === "manager") {
//       const managerProjects = await ProjectModel.find({
//         project_ownership: userId,
//       }).select("_id");

//       filter.$or = [{ report_to: userId }, { project: { $in: managerProjects } }];
//     } else if (userRole === "team lead") {
//       filter.$or = [{ assigned_to: userId }, { assigned_by: userId }];
//     } else if (userRole === "member") {
//       filter.assigned_to = userId;
//     }

//     if (status) {
//       const validStatuses = ["Completed", "In progress", "Not started", "Pending", "Cancelled"];
//       if (!validStatuses.includes(status)) {
//         return res.status(400).json({
//           status: false,
//           message: `Invalid status provided. Valid statuses are: ${validStatuses.join(", ")}`,
//         });
//       }
//       filter.status = status;
//     }

//     if (search.trim()) {
//       const searchRegex = new RegExp(search.trim(), "i");
//       filter.$or = [
//         { task_title: { $regex: searchRegex } },
//         { task_description: { $regex: searchRegex } },
//       ];
//     }

//     const tasks = await TaskModel.find(filter)
//       .sort({ _id: -1 })
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber)
//       .populate("assigned_to", "name email")
//       .populate("assigned_by", "name email")
//       .populate("report_to", "name email")
//       .populate("milestone", "name status")
//       .populate("project", "project_name");

//     const statusSummary = tasks.reduce((acc, task) => {
//       acc[task.status] = (acc[task.status] || 0) + 1;
//       return acc;
//     }, {});

//     const totalTasks = await TaskModel.countDocuments(filter);

//     return res.status(200).json({
//       status: true,
//       message: "Tasks fetched successfully",
//       data: {
//         total: totalTasks,
//         statusSummary,
//         tasks,
//         pagination: {
//           currentPage: pageNumber,
//           totalPages: Math.ceil(totalTasks / limitNumber),
//         },
//       },
//     });
//   } catch (error) {
//     console.error(`[getAllTask]: Error fetching tasks - ${error.message}`);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while fetching tasks",
//     });
//   }
// };



export const getTask = async (req, res) => {
  const { id } = req.body;

  try {
    const task = await TaskModel.findOne({ _id: id, is_deleted: false })
      .populate("project", "project_name") // Populate project details
      .populate("milestone", "name status") // Populate milestone details
      .populate("assigned_to", "name mail") // Populate assigned_to details
      .populate("assigned_by", "name mail") // Populate assigned_by details
      .populate("report_to", "name mail");
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error fetching task" });
  }
};

// export const updateTask = async (req, res) => {
//   const {
//     _id,
//     project,
//     assigned_to,
//     assigned_by,
//     report_to,
//     status,
//     priority,
//     start_date,
//     end_date,
//     task_description,
//     task_title,
//   } = req.body;
//   const { role } = req.user;
//   console.log(req.body);
//   if (role !== "admin") {
//     return res.status(403).json({ status: false, message: "No Authorization" });
//   }

//   const updatedTask = {
//     project: project._id,
//     assigned_to: assigned_to._id,
//     assigned_by: assigned_by._id,
//     report_to: report_to._id,
//     status,
//     priority,
//     start_date,
//     end_date,
//     task_description,
//     task_title,
//   };

//   try {
//     const task = await TaskModel.findByIdAndUpdate(_id, updatedTask, {
//       new: true,
//     });

//     if (!task) {
//       return res.status(404).json({ status: false, message: "Task not found" });
//     }

//     return res.status(200).json({
//       status: true,
//       message: "Task updated successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error updating task" });
//   }
// };
// export const updateTasknew = async (req, res) => {
//   const {
//     _id,
//     project,
//     assigned_to,
//     assigned_by,
//     report_to,
//     status,
//     priority,
//     start_date,
//     end_date,
//     task_description,
//     task_title,
//     milestone, // Include milestone in the update
//   } = req.body;

//   const { role } = req.user;
//   console.log(req.body);

//   // Check for admin role
//   if (role !== "admin") {
//     return res.status(403).json({ status: false, message: "No Authorization" });
//   }

//   // Prepare the updated task object, including milestone
//   const updatedTask = {
//     project: project._id,
//     assigned_to: assigned_to._id,
//     assigned_by: assigned_by._id,
//     report_to: report_to._id,
//     status,
//     priority,
//     start_date,
//     end_date,
//     task_description,
//     task_title,
//     milestone, // Include milestone in the update object
//   };

//   try {
//     // Find and update the task by its ID
//     const task = await TaskModel.findByIdAndUpdate(_id, updatedTask, {
//       new: true, // Return the updated task
//     });

//     // If task not found
//     if (!task) {
//       return res.status(404).json({ status: false, message: "Task not found" });
//     }

//     // Return success response with updated task data
//     return res.status(200).json({
//       status: true,
//       message: "Task updated successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error updating task" });
//   }
// };

export const updateTask = async (req, res) => {
  const {
    _id,
    project,
    assigned_to,
    assigned_by,
    report_to,
    status,
    priority,
    start_date,
    end_date,
    task_description,
    task_title,
    milestone, // Include milestone in the update
    daily_update, // New update for the daily updates
  } = req.body;

  const { role } = req.user;
  console.log(req.body);

  // Check for admin role
  const allowedRoles = ["admin", "manager", "team lead"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    // Find the task by its ID
    const task = await TaskModel.findById(_id);

    // If task not found
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Update the task fields
    task.project = project._id;
    task.assigned_to = assigned_to._id;
    task.assigned_by = assigned_by._id;
    task.report_to = report_to._id;
    task.status = status;
    task.priority = priority;
    task.start_date = start_date;
    task.end_date = end_date;
    task.task_description = task_description;
    task.task_title = task_title;
    task.milestone = milestone;

    // Add the new daily update to the array
    if (daily_update) {
      task.daily_updates = task.daily_updates || [];
      task.daily_updates.push({
        date: new Date(),
        description: daily_update,
      });
    }

    // Save the updated task
    const updatedTask = await task.save();

    // Return success response with updated task data
    return res.status(200).json({
      status: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error updating task" });
  }
};

//fazil code
// export const DailyTaskUpdate = async (req, res) => {
//   const {
//     _id,
//     daily_update, // Only this field is allowed for members
//   } = req.body;

//   const { role } = req.user; // Assume `req.user` contains the authenticated user's details

//   console.log(req.body);

//   // Restrict updates to `daily_update` for the member role only
//   // if (role !== "member"||role !== "team lead") {
//   //   return res
//   //     .status(403)
//   //     .json({ status: false, message: "Only members can update daily updates" });
//   // }

//   // Check if daily_update is provided
//   if (!daily_update) {
//     return res
//       .status(400)
//       .json({ status: false, message: "Daily update description is required" });
//   }

//   try {
//     // Find the task by its ID
//     const task = await TaskModel.findById(_id);

//     // If task not found
//     if (!task) {
//       return res.status(404).json({ status: false, message: "Task not found" });
//     }

//     // Add the new daily update to the `daily_updates` array
//     task.daily_updates = task.daily_updates || [];
//     task.daily_updates.push({
//       date: new Date(),
//       description: daily_update,
//     });

//     // Save the updated task
//     const updatedTask = await task.save();

//     // Return success response with updated task data
//     return res.status(200).json({
//       status: true,
//       message: "Daily update added successfully",
//       data: updatedTask,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error updating daily update" });
//   }
// };


import { fetchProjectDetails } from "../Helper function/projectHelper.js";

export const DailyTaskUpdate = async (req, res) => {
  const { _id, daily_update, hours_spent } = req.body;
  const { role } = req.user;

  if (!["member", "team lead", "manager"].includes(role)) {
    return res.status(403).json({
      status: false,
      message: "You are not authorized to update daily tasks",
    });
  }

  try {
    const task = await TaskModel.findById(_id);

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.daily_updates.push({
      date: new Date(),
      description: daily_update || "",
      hours_spent,
    });

    await task.save();

    // Recalculate project details
    const { project, totalHoursSpent } = await fetchProjectDetails(
      task.project
    );

    return res.status(200).json({
      status: true,
      message: "Daily update added successfully",
      data: { task, totalHoursSpent },
      projectSummary: {
        projectId: project._id,
        projectName: project.project_name,
        estimatedHours: project.estimated_hours,
        percentageSpent: (
          (totalHoursSpent / project.estimated_hours) *
          100
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error updating daily task" });
  }
};


export const DeleteDailyTaskUpdate = async (req, res) => {
  const { _id, updateId } = req.body; // Task ID and specific daily update ID to delete
  const { role } = req.user; // Assume `req.user` contains the authenticated user's details

  console.log(req.body);

  // Restrict deletion to admin role
  if (role !== "admin") {
    return res.status(403).json({
      status: false,
      message: "You are not authorized to delete daily task updates",
    });
  }

  try {
    // Find the task by its ID
    const task = await TaskModel.findById(_id);

    // If task not found
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Check if the update exists
    const updateIndex = task.daily_updates.findIndex(
      (update) => update._id.toString() === updateId
    );

    if (updateIndex === -1) {
      return res.status(404).json({
        status: false,
        message: "Daily update not found",
      });
    }

    // Remove the specific daily update
    task.daily_updates.splice(updateIndex, 1);

    // Save the updated task
    const updatedTask = await task.save();

    return res.status(200).json({
      status: true,
      message: "Daily update deleted successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error deleting daily task update" });
  }
};

//fazil code
// export const create_skill_Improvement = async (req, res) => {
//   const { id, message } = req.body;

//   if (req.user.role !== "member") {
//     return res.status(403).json({ status: false, message: "No Authorization" });
//   }

//   try {
//     const task = await TaskModel.findByIdAndUpdate(
//       id,
//       {
//         $push: {
//           skill_improvement: {
//             sentFromId: req.user.id,
//             message,
//             date: new Date(),
//           },
//         },
//       },
//       { new: true }
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Skill improvement added successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error adding skill improvement" });
//   }
// };

export const create_skill_Improvement = async (req, res) => {
  const { id, message } = req.body;

  // Ensure message is provided
  if (!message || message.trim() === "") {
    return res
      .status(400)
      .json({ status: false, message: "Message is required" });
  }

  // Only members can create skill improvements
  if (req.user.role !== "member") {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    // Find and update the task by ID
    const task = await TaskModel.findByIdAndUpdate(
      id,
      {
        $push: {
          skill_improvement: {
            sentFromId: req.user.id,
            message,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    // Return success response
    return res.status(200).json({
      status: true,
      message: "Skill improvement added successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error adding skill improvement" });
  }
};

//fazil code
// export const update_skill_Improvement = async (req, res) => {
//   const { id, message, skills_approval_status } = req.body;

//   if (req.user.role !== "team lead" && req.user.role !== "manager") {
//     return res.status(403).json({ status: false, message: "No Authorization" });
//   }

//   try {
//     const updateQuery = {
//       $push: {
//         skill_improvement: {
//           sentFromId: req.user.id,
//           message,
//           date: new Date(),
//         },
//       },
//     };

//     if (req.user.role === "manager" || req.user.role === "admin") {
//       updateQuery.$set = {
//         skills_approval_status,
//         skill_imp_reviewed_by: req.user.id,
//       };
//     }

//     const task = await TaskModel.findByIdAndUpdate(id, updateQuery, {
//       new: true,
//     });

//     return res.status(200).json({
//       status: true,
//       message: "Skill improvement updated successfully",
//       data: task,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error updating skill improvement" });
//   }
// };

export const update_skill_Improvement = async (req, res) => {
  const { id, message, skills_approval_status } = req.body;

  // Ensure message is provided
  if (!message || message.trim() === "") {
    return res
      .status(400)
      .json({ status: false, message: "Message is required" });
  }

  // Only Team Leads or Managers can update skill improvement
  if (req.user.role !== "team lead" && req.user.role !== "manager") {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    const updateQuery = {
      $push: {
        skill_improvement: {
          sentFromId: req.user.id,
          message,
          date: new Date(),
        },
      },
    };

    // If the user is Manager or Admin, update the approval status as well
    if (req.user.role === "manager" || req.user.role === "admin") {
      updateQuery.$set = {
        skills_approval_status,
        skill_imp_reviewed_by: req.user.id,
      };
    }

    // Find and update the task by ID
    const task = await TaskModel.findByIdAndUpdate(id, updateQuery, {
      new: true,
    });

    // Return success response
    return res.status(200).json({
      status: true,
      message: "Skill improvement updated successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error updating skill improvement" });
  }
};

export const create_growth_assessment = async (req, res) => {
  const { id, message } = req.body;

  if (req.user.role !== "member") {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    const task = await TaskModel.findByIdAndUpdate(
      id,
      {
        $push: {
          growth_assessment: {
            sentFromId: req.user.id,
            message,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Growth assessment created successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error creating growth assessment" });
  }
};

export const update_growth_assessment = async (req, res) => {
  const { id, message } = req.body;

  if (
    req.user.role !== "team lead" &&
    req.user.role !== "manager" &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ status: false, message: "No Authorization" });
  }

  try {
    const task = await TaskModel.findByIdAndUpdate(
      id,
      {
        $push: {
          growth_assessment: {
            sentFromId: req.user.id,
            message,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Growth assessment updated successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Error updating growth assessment" });
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
export const getTaskByEmployee = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = "", employeeId } = req.body; // Changed from req.query to req.body

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const userId = employeeId || req.user.id; 
    const userRole = req.user.role; 
    const userDepartment = req.user.department; 

    let filter = { is_deleted: false };

    if (userRole === "manager") {
      const managerProjects = await ProjectModel.find({
        project_ownership: userId,
      }).select("_id");

      filter.$or = [
        { report_to: userId },
        { project: { $in: managerProjects } },
      ];
    } else if (userRole === "team lead") {
      filter.$or = [{ assigned_to: userId }, { assigned_by: userId }];
    } else if (userRole === "member") {
      filter.assigned_to = userId;
    }

    // If fetching for a specific employee, enforce their tasks
    if (employeeId) {
      filter.assigned_to = employeeId;
    }

    if (userDepartment === "testing") {
      const uatTasks = await TaskModel.find({
        move_to_uat: true,
        tester_approval: false,
        is_deleted: false
      })
        .populate("project", "project_name")
        .populate("assigned_to", "name email")
        .populate("assigned_by", "name email")
        .populate("report_to", "name email")
        .sort({ updatedAt: -1 });

      const uatStatusSummary = uatTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        status: true,
        message: "Tasks retrieved successfully.",
        data: {
          uatTasks,
          uatStatusSummary,
        },
      });
    }

    const validStatuses = [
      "Completed",
      "In progress",
      "Not started",
      "Pending",
      "Cancelled",
    ];

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: false,
          message: `Invalid status provided. Valid statuses are: ${validStatuses.join(", ")}`,
        });
      }
      filter.status = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      // Preserve existing $or filters if already set
      filter.$or = filter.$or ? [...filter.$or, { task_title: searchRegex }, { task_description: searchRegex }] 
                              : [{ task_title: searchRegex }, { task_description: searchRegex }];
    }

    const tasks = await TaskModel.find(filter)
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("assigned_to", "name email")
      .populate("assigned_by", "name email")
      .populate("report_to", "name email")
      .populate("milestone", "name status")
      .populate("project", "project_name");

    const statusSummary = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const totalTasks = await TaskModel.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Tasks fetched successfully",
      data: {
        total: totalTasks,
        statusSummary,
        tasks,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTasks / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error(`[getTaskByEmployee]: Error fetching tasks - ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching tasks",
    });
  }
};

