import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // File title
    description: { type: String }, // Optional file description
    attachments: {
      file_name: { type: String, trim: true, required: true }, // Original file name
      file_url: { type: String, trim: true, required: true }, // File path or URL
      uploaded_at: { type: Date, default: Date.now }, // Upload timestamp
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the User model
      required: true,
    },
    accessRoles: {
      type: [String], // Array of roles that can access the file
      default: ["all"], // Default visibility to "all"
    },
  },
  { timestamps: true }
);

const FileModel = mongoose.model("File", fileSchema);
export default FileModel;
