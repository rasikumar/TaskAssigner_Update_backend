import mongoose from "mongoose"; // Import mongoose

const projectSchema = new mongoose.Schema(
  {
    project_name: {
      type: String,
      required: true,
      trim: true,
    },
    project_description: {
      type: String,
      trim: true,
    },
    // project_document: {
    //   type: String, // This will store the file path or URL
    //   required: false,
    // },
    
    project_ownership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Assuming the ownership refers to a user
      required: true,
    },
    // teamMembers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "user", // Reference to users who are team members
    //   },
    // ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,

      default: Date.now,

    },
    project_status: {
      type: String,
      enum: ["Not Started", "In Progress", "Pending", "Completed"],
      default: "Not Started",
    },
    estimated_hours: {
      type: Number,
      required: true,
    },
    attachments: 
      {
        file_name: {
          type: String,
          trim: true,
        },
        file_url: {
          type: String,
          trim: true,
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
      },
    
    milestones: [
      { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Milestone", // Reference to the Milestone schema
      },
    ],
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const ProjectModel = mongoose.model("Project", projectSchema);
export default ProjectModel;