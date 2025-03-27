// helpers/projectHelper.js
import ProjectModel from "../Model/Project_schema.js";
import { TaskModel } from "../Model/Task_scheme.js";

export const fetchProjectDetails = async (projectId) => {
  try {
    // Fetch project details
    const project = await ProjectModel.findById(projectId)
      .populate("project_ownership", "name mail")
      .populate("milestones", "name status");

    if (!project) {
      return { error: "Project not found" };
    }

    // Fetch tasks related to the project
    const tasks = await TaskModel.find({ project: projectId }).populate(
      "assigned_to",
      "name mail"
    );

    // Calculate total hours spent
    const totalHoursSpent = tasks.reduce((total, task) => {
      const taskHours = task.daily_updates.reduce(
        (sum, update) => sum + (update.hours_spent || 0),
        0
      );
      return total + taskHours;
    }, 0);

    return { project, tasks, totalHoursSpent };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return { error: "Internal server error" };
  }
};
