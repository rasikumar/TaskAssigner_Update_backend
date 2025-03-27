import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project", // Reference to the Project model
      required: true,
    },
 
    //developer side
    //milestone based complete totally both (tester and dev)side
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Pending","On Hold"],
      default: "Not Started",
    },

     // Developer Side Status
     developer_status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
    },

    // Tester Side Status
    tester_status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
  }, 
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const MilestoneModel = mongoose.model("Milestone", milestoneSchema);
export default MilestoneModel;
