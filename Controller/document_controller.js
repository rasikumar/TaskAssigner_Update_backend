import FileModel from "../Model/document_schema.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid"; // Unique filename generation
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// Upload a single file



export const uploadFile = async (req, res) => {
  try {
    if (!req.user || (req.user.department !== "human-resource" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Permission denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, accessRoles } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // ✅ Generate timestamp ONCE and use it everywhere
    const timestamp = Date.now();
    const originalFileName = req.file.originalname;
    const newFileName = `${timestamp}-${originalFileName}`;
    const uploadDir = path.join(__dirname, "../uploads");

    // ✅ Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const newFilePath = path.join(uploadDir, newFileName);

    // ✅ Move the uploaded file
    fs.renameSync(req.file.path, newFilePath);

    const file_url = `/uploads/${newFileName}`;
    const uploadedBy = req.user.id;

    // ✅ Store the EXACT file name in the database
    const newFile = new FileModel({
      title,
      description,
      attachments: { file_name: newFileName, file_url },
      uploadedBy,
      accessRoles,
    });

    await newFile.save();

    res.status(200).json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getFile = async (req, res) => {
  try {
    const { fileName } = req.params; // Use filename from URL
    const filePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const updateFile = async (req, res) => {
//   try {
//     const { fileId } = req.params;
//     const { title, description, accessRoles } = req.body;

//     // Ensure only HR and Admin can update
//     if (!req.user || (req.user.role !== "hr" && req.user.role !== "admin")) {
//       return res.status(403).json({ message: "Permission denied" });
//     }

//     // Find the existing file
//     const existingFile = await FileModel.findById(fileId);
//     if (!existingFile) {
//       return res.status(404).json({ message: "File not found" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // Delete the old file if it exists
//     const oldFilePath = path.join(__dirname, "uploads", existingFile.attachments.file_url);
//     if (fs.existsSync(oldFilePath)) {
//       fs.unlinkSync(oldFilePath);
//     }

//     // Save new file details
//     const newFileName = req.file.originalname;
//     const newFileUrl = `/uploads/${uuidv4()}_${newFileName}`;

//     existingFile.title = title || existingFile.title;
//     existingFile.description = description || existingFile.description;
//     existingFile.attachments = { file_name: newFileName, file_url: newFileUrl };
//     existingFile.accessRoles = accessRoles || existingFile.accessRoles;

//     await existingFile.save();

//     res.status(200).json({ message: "File updated successfully", file: existingFile });
//   } catch (error) {
//     console.error("Error updating file:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



//All users can view the file in below correct code

// export const getAllFiles = async (req, res) => {
//   try {
//     // Fetch all files from the database
//     const files = await FileModel.find().populate("uploadedBy", "name email role");

//     if (!files.length) {
//       return res.status(404).json({ message: "No files found" });
//     }

//     res.status(200).json({ message: "Files retrieved successfully", files });
//   } catch (error) {
//     console.error("Error fetching files:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };







// Manually define __dirname in ES module




//use that code one delete and update function



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteFile = async (req, res) => {
  try {
    const userRole = req.user.role;
    const department = req.user.department;
    let fileId = req.params.id;

    // console.log("Raw fileId:", fileId);

    // Remove invalid characters (like a leading colon)
    fileId = fileId.replace(/^:/, "");

    // Validate fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Only Admin & HR can delete
    if (userRole !== "admin" && department !== "human-resource") {
      return res.status(403).json({ message: "Unauthorized! Only HR and Admin can delete files." });
    }

    const file = await FileModel.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if file has a valid path
    if (!file.attachments || !file.attachments.file_url) {
      return res.status(400).json({ message: "File URL is missing in database" });
    }

    // Correctly resolve the file path
    const filePath = path.join(__dirname, "../uploads", path.basename(file.attachments.file_url));

    // Check if file exists and delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("File deleted from storage:", filePath);
    } else {
      console.warn("File not found in storage:", filePath);
    }

    // Remove from database
    await FileModel.findByIdAndDelete(fileId);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const getAllFiles = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const userRole = req.user.role;

    let files;
    
    if (userRole === "admin" || userRole === "hr") {
      // Admin and HR can view all files
      files = await FileModel.find().populate("uploadedBy", "name email role");
    } else {
      // Other users can only view files that include their role or "all"
      files = await FileModel.find({
        accessRoles: { $in: [userRole, "all"] },
      }).populate("uploadedBy", "name email role");
    }

    if (!files.length) {
      return res.status(404).json({ message: "No files found" });
    }

    res.status(200).json({ message: "Files retrieved successfully", files });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Server error" });
  }
};

