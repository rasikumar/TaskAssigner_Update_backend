import MilestoneModel from "../Model/Milestone_schema.js"; // Ensure you import the Milestone model
import ProjectModel from "../Model/Project_schema.js"; // Ensure you import the Project model
import { TaskModel } from "../Model/Task_scheme.js";
import cron from "node-cron";



export const deleteMilestone = async (req, res) => {   
    try {
        const milestone = await MilestoneModel.findByIdAndDelete(req.params.id);
        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found" });
        }
        res.status(200).json({ message: "Milestone deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
 }


 export const getMilestonesForConsentProjects = async (req, res) => {
    try {
        const { projectId } = req.body;
        console.log("projectId",projectId);
        // Validate project ID
        if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        // Fetch milestones for consent projects
        const milestones = await MilestoneModel.find({project: projectId});


        if (!milestones || milestones.length === 0) {
            return res.status(404).json({ status:false,message: "No milestones found for consent projects" });
        }

        // Success response
        return res.status(200).json(milestones);
    } catch (error) {
        // Log error for debugging
        console.error("Error fetching milestones for consent projects:", error);

        // Internal server error response
        return res.status(500).json({ message: "An error occurred while retrieving milestones" });
    }
    
};



export const getMilestones_project_WithTasks_status = async (req, res) => {
  try {
      const { projectId } = req.params;
      console.log("Received projectId:", projectId);

      // Ensure milestone status updates before fetching
      await checkAndUpdateMilestoneStatus();

      // Fetch all milestones related to the project
      const milestones = await MilestoneModel.find({ project: projectId, is_deleted: false });

      if (milestones.length === 0) {
          return res.status(200).json({ success: true, developer_status: "Completed", milestones: [] });
      }

      // Fetch tasks related to each milestone
      const milestonesWithTasks = await Promise.all(
          milestones.map(async (milestone) => {
              const tasks = await TaskModel.find({ milestone: milestone._id });

              return {
                  ...milestone.toObject(),
                  tasks: tasks.map(task => ({
                      _id: task._id,
                      name: task.name,
                      status: task.status,
                      role: task.role,
                  })),
                  allTasksCompleted: tasks.length > 0 && tasks.every(task => task.status === "Completed") ? "Yes" : "No"
              };
          })
      );

      res.status(200).json({
          success: true,
          developer_status: milestonesWithTasks.every(milestone => milestone.allTasksCompleted === "Yes") 
              ? "Completed" 
              : "In Progress",
          milestones: milestonesWithTasks,
      });

  } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
};

//correctly worked code



// export const checkAndUpdateMilestoneStatus = async () => {
//   try {
//     console.log("⏳ Checking milestone statuses...");

//     const milestones = await MilestoneModel.find({ is_deleted: false });

//     for (const milestone of milestones) {
//         // 해당 milestone의 모든 tasks 가져오기
//         const tasks = await TaskModel.find({ milestone: milestone._id });

//         // console.log("task comming", tasks);

//         // Developer Status Check
//         const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === "Completed");
//         const newDeveloperStatus = allTasksCompleted ? "Completed" : "In Progress";

//         if (milestone.developer_status !== newDeveloperStatus) {
//             milestone.developer_status = newDeveloperStatus;
//             milestone.updatedAt = new Date();
//             await milestone.save();
//             // console.log(`✅ Milestone "${milestone.name}" updated to "${newDeveloperStatus}"`);
//         }

//         // **Tester Status Check**
//         if (newDeveloperStatus === "Completed") { // Only check if Developer side is completed
//             const allTesterApproved = tasks.length > 0 && tasks.every(task => task.tester_approval === true);

//             const newTesterStatus = allTesterApproved ? "Completed" : "In Progress";

//             if (milestone.tester_status !== newTesterStatus) {
//                 milestone.tester_status = newTesterStatus;
//                 milestone.updatedAt = new Date();
//                 await milestone.save();
//                 // console.log(`✅ Milestone "${milestone.name}" tester status updated to "${newTesterStatus}"`);
//             }
//         }
//     }

//     console.log("✅ Milestone status check complete.");
//   } catch (error) {
//     console.error("❌ Error updating milestone status:", error);
//   }
// };



export const checkAndUpdateMilestoneStatus = async () => {
  try {
    console.log("⏳ Checking milestone statuses...");

    const milestones = await MilestoneModel.find({ is_deleted: false });

    for (const milestone of milestones) {
      // 해당 milestone의 모든 tasks 가져오기
      const tasks = await TaskModel.find({ milestone: milestone._id });

      // Developer Status Check
      const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === "Completed");
      const newDeveloperStatus = allTasksCompleted ? "Completed" : "In Progress";

      if (milestone.developer_status !== newDeveloperStatus) {
        milestone.developer_status = newDeveloperStatus;
        milestone.updatedAt = new Date();
        await milestone.save();
      }

      // Tester Status Check (Only if Developer side is completed)
      if (newDeveloperStatus === "Completed") {
        const allTesterApproved = tasks.length > 0 && tasks.every(task => task.tester_approval === true);
        const newTesterStatus = allTesterApproved ? "Completed" : "In Progress";

        if (milestone.tester_status !== newTesterStatus) {
          milestone.tester_status = newTesterStatus;
          milestone.updatedAt = new Date();
          await milestone.save();
        }
      }

      // **Milestone Status Update (Only if both Developer & Tester are completed)**
      if (milestone.developer_status === "Completed" && milestone.tester_status === "Completed") {
        if (milestone.status !== "Completed") {
          milestone.status = "Completed";
          milestone.updatedAt = new Date();
          await milestone.save();
          console.log(`🎯 Milestone "${milestone.name}" marked as Completed ✅`);
        }
      }
    }

    console.log("✅ Milestone status check complete.");
  } catch (error) {
    console.error("❌ Error updating milestone status:", error);
  }
};
