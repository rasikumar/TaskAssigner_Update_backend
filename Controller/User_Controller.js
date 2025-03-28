import { UserModel } from "../Model/User_scheme.js";
import { TaskModel } from "../Model/Task_scheme.js";

import { exportToExcel } from "../Controller/Export_controller.js";
import { importToExcel } from "../Controller/Import_Controller.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { boolean } from "zod";
import bcrypt from "bcrypt";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "Evvi_solutions_private_limited";

export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]
    ? req.headers["authorization"]
    : "";
  if (!token) {
    return res
      .status(200)
      .json({ status: false, message: "Token not provided" });
  }
  // token = token.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    // console.log(decoded);

    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(200)
          .json({ status: false, statusCode: 700, message: "Token expired" });
      } else {
        return res
          .status(200)
          .json({ status: false, message: "Invalid token" });
      }
    }

    if (decoded.role == "admin") {
      return res.status(200).json({ status: false, message: "Invalid User" });
    }
    if (!decoded.admin_verify) {
      return res
        .status(200)
        .json({ status: false, message: "Email Verification Pending " });
    }
    // Log to verify user object
    req.user = decoded;
    // console.log("Authenticated user: ", req.user);
    next();
  });
};

//fazil correct code
// export const user_login = async (req, res) => {
//   const { mail, password } = req.body;

//   try {
//     // Check if email and password are provided
//     if (!mail || !password) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Email and password are required" });
//     }

//     // Find the user by email
//     const user = await UserModel.findOne({ mail: mail.toLowerCase() }).select(
//       "-__v -createdAt -updatedAt"
//     );

//     // Check if user exists
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Check password
//     if (user.password !== password) {
//       return res
//         .status(401)
//         .json({ status: false, message: "Invalid credentials" });
//     }

//     // Generate token
//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role,
//         mail: user.mail,
//         admin_verify: user.admin_verify,
//       },
//       JWT_SECRET,
//       { expiresIn: "5h" } // Token expiry
//     );

//     // Prepare user data without sensitive fields
//     const userData = {
//       _id: user._id,
//       name: user.name,
//       phone: user.phone,
//       mail: user.mail,
//       role: user.role,
//       admin_verify: user.admin_verify,
//       employee_id: user.employee_id,
//       department: user.department,
//     };

//     // Send response
//     return res.status(200).json({
//       status: true,
//       message: "Success",
//       data: userData,
//       token,
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     return res
//       .status(500)
//       .json({ status: false, message: "Internal server error" });
//   }
// };

export const user_login = async (req, res) => {
  const { mail, password } = req.body;

  try {
    // Validate input fields
    if (!mail || !password) {
      return res
        .status(400)
        .json({ status: false, message: "Email and password are required." });
    }

    // Find the user by email (case-insensitive)
    const user = await UserModel.findOne({ mail: mail.toLowerCase() }).select(
      "-__v -createdAt -updatedAt"
    );

    // Check if the user exists
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid credentials." });
    }

    // Check admin verification status
    if (!user.admin_verify) {
      return res.status(403).json({
        status: false,
        message: "Admin verification pending.",
      });
    }

    // Check HR approval status
    if (!user.hr_approval) {
      return res.status(403).json({
        status: false,
        message: "HR approval pending.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        mail: user.mail,
        department: user.department,
        admin_verify: user.admin_verify,
        hr_approval: user.hr_approval,
      },
      JWT_SECRET,
      { expiresIn: "5h" } // Token expires in 5 hours
    );

    // Prepare user data for response (excluding sensitive fields)
    const userData = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      mail: user.mail,
      role: user.role,
      admin_verify: user.admin_verify,
      hr_approval: user.hr_approval,
      employee_id: user.employee_id,
      department: user.department,
    };

    // Log user data for debugging purposes
    // console.log("User details:", userData);

    // Send success response
    return res.status(200).json({
      status: true,
      message: "Login successful.",
      data: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle internal server errors
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

export const user_dashboard = async (req, res) => {
  // console.log(req.user);
  console.log("user_dashboard");
  const { id, role, mail, department } = req.user;

  // //  Ensure only users from the "testing" department can access this dashboard
  // if (department !== "testing") {
  //   return res.status(403).json({
  //     status: false,
  //     message:
  //       "Access denied. Only users from the testing department are authorized to view the dashboard.",
  //   });
  // }

  let result = "";
  // if(department === "testing"){
  //   result = await TaskModel.find({ assigned_to: id });
  // }

  if (
    (department === "Human-resource" && role === "hr") ||
    role === "manager" ||
    role === "team lead"
  ) {
    // For HR, get overall tasks with specific statuses
    result = await TaskModel.find({
      status: { $in: ["Pending", "Completed", "Not started", "In progress"] },
    });
  } else {
    // For other users, get tasks assigned to the specific user ID
    result = await TaskModel.find({
      assigned_to: id,
      status: { $in: ["Pending", "Completed", "Not started", "In progress"] },
    });
  }

  // console.log("id", id);
  const pendingTasks = result.filter((task) => task.status === "Pending");
  const completedTasks = result.filter((task) => task.status === "Completed");
  const inProgressTasks = result.filter(
    (task) => task.status === "In progress"
  );
  // const result = await TaskModel.find({ assigned_to: id });
  // const result_count = await TaskModel.find({
  //   assigned_to: id,
  // }).countDocuments();
  // .populate( "_id" , "user");

  const data = {
    result,
    pendingTasks,
    completedTasks,
    inProgressTasks,
  };

  // console.log("task_count :", result_count);

  console.log(`user dashbroad ${role}`);
  res.status(200).json({ message: "users", result: data });
};

export const createUser = async (req, res) => {
  const {
    name,
    mail,
    password,
    confirmPassword,
    phone,
    role,
    admin_verify,
    hr_approved,
    employee_id,
    department,
    starting_date,
    lastWorking_date,
  } = req.body;

  try {
    // Ensure only admin users can create new users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only admins are authorized to create users.",
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: false, message: "Passwords do not match." });
    }

    // Validate required fields
    if (!name || !mail || !password || !phone || !role) {
      return res
        .status(400)
        .json({ status: false, message: "Please enter all required fields." });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ mail: mail.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: false, message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new UserModel({
      name,
      mail: mail.toLowerCase(),
      password: hashedPassword,
      phone,
      role,
      admin_verify,
      hr_approved,
      employee_id,
      department,
      starting_date,
      lastWorking_date,
    });

    // Save user to the database
    await newUser.save();

    return res.status(201).json({
      status: true,
      message: "User created successfully.",
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};

export const approveUserByHR = async (req, res) => {
  const { userId, hr_approval } = req.body;

  try {
    // Ensure only HR and Admin can approve users
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ status: false, message: "Access denied" });
    }

    // Validate hr_approval field
    if (typeof hr_approval !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "hr_approval must be a boolean value (true or false).",
      });
    }

    // Find the user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // ✅ If the user is an admin, approval is not needed
    if (user.role === "admin") {
      return res.status(200).json({
        status: true,
        message: "Approval is not required for admin accounts.",
        data: {
          userId: user._id,
          name: user.name,
          role: user.role,
        },
      });
    }

    // ✅ Ensure only non-admin users require admin verification
    if (!user.admin_verify) {
      return res.status(400).json({
        status: false,
        message: "User must be verified by admin first.",
      });
    }

    // Update hr_approval status
    user.hr_approval = hr_approval;
    await user.save();

    // Send a success response
    const message = hr_approval
      ? "User approved successfully."
      : "User approval has been revoked.";

    res.status(200).json({
      status: true,
      message,
      data: {
        userId: user._id,
        name: user.name,
        hr_approval: user.hr_approval,
      },
    });
  } catch (error) {
    console.error("Error updating approval status:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// export const approveUserByHR = async (req, res) => {
//   const { userId, hr_approval } = req.body;

//   try {
//     // Ensure only HR can approve users
//     if (req.user.role !== "hr" && req.user.role !== "admin") {
//       return res.status(403).json({ status: false, message: "Access denied" });
//     }

//     // Validate hr_approval field
//     if (typeof hr_approval !== "boolean") {
//       return res.status(400).json({
//         status: false,
//         message: "hr_approval must be a boolean value (true or false).",
//       });
//     }

//     // Find the user by ID
//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//      // ✅ If the user is an admin, HR approval is not required
//      if (user.role === "admin") {
//       return res.status(200).json({
//         status: true,
//         message: "HR approval is not required for admin accounts.",
//         data: {
//           userId: user._id,
//           name: user.name,
//           role: user.role,
//         },
//       });
//     }

//     // Ensure the user is verified by admin before HR approval
//     if (!user.admin_verify) {
//       return res.status(400).json({
//         status: false,
//         message: "User must be verified by admin first.",
//       });
//     }

//     // Update hr_approval status
//     user.hr_approval = hr_approval;
//     await user.save();

//     // Send a success response
//     const message = hr_approval
//       ? "User approved by HR. User can now proceed with work."
//       : "HR approval has been revoked for the user.";

//     res.status(200).json({
//       status: true,
//       message,
//       data: {
//         userId: user._id,
//         name: user.name,
//         hr_approval: user.hr_approval,
//       },
//     });
//   } catch (error) {
//     console.error("Error updating HR approval status:", error);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// };

export const updateUser = async (req, res) => {
  // console.log(req.body);
  const {
    name,
    mail,
    password,
    phone,
    role,
    admin_verify,
    hr_approval,
    employee_id,
    department,
    starting_date,
    lastWorking_date,
  } = req?.body;

  const updateData = {
    name,
    mail,
    password,
    phone,
    role,
    admin_verify,
    hr_approval,
    employee_id,
    department,
    starting_date,
    lastWorking_date,
  };

  UserModel.findOneAndUpdate({ mail: mail }, updateData)
    .then((updatedUser) => {
      if (!updatedUser) {
        return res
          .status(200)
          .json({ status: false, message: "User not found" });
      } else {
        return res.status(200).json({
          status: true,
          message: "Successfully Updated User",
        });
      }
    })
    .catch((err) => {
      return res
        .status(200)
        .json({ status: false, message: "Error in Updating User" });
    });
};

export const deleteUser = async (req, res) => {
  const { id } = req.body; // Safely access the body object
  if (!id) {
    return res
      .status(400)
      .json({ status: false, message: "User ID is required" });
  }

  try {
    // Update the `is_deleted` field to true
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { is_deleted: true } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({
      status: true,
      message: "User deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error in deleting user",
      error: error.message,
    });
  }
};

export const findById = async (req, res) => {
  const { id } = req?.body;

  await UserModel.find({ _id: id })
    .select("-password")
    .then((users) => {
      if (users) {
        return res.status(200).json({
          status: "Success",
          message: "Successfully Retrieved",
          data: users,
        });
      } else {
        return res.status(200).json({
          status: "failure",
          message: "No User found",
          data: users,
        });
      }
    })
    .catch((err) => {
      return res
        .status(200)
        .json({ status: "Failure", message: "Error in Fetchind Data" });
    });
};

//fazil correct code
// export const getAllUserEmpMail = async (req, res) => {
//   try {
//     console.log(req.user); // Debugging log to verify `req.user` is populated

//     if (!req.user || !req.user.role) {
//       return res.status(403).json({
//         status: false,
//         message: "Access denied: User role is undefined",
//       });
//     }

//     const loggedInUserRole = req.user.role; // Extract the logged-in user's role
//     let filterRoles;

//     // Set filter roles based on the user's role
//     if (loggedInUserRole === "admin") {
//       filterRoles = ["manager", "team lead", "member"];
//     } else if (loggedInUserRole === "manager") {
//       filterRoles = ["team lead", "member"];
//     } else if (loggedInUserRole === "team lead") {
//       filterRoles = ["member"];
//     } else {
//       filterRoles = ["member"];
//     }

//     // Query database for emails based on filterRoles
//     const emails = await UserModel.find(
//       { role: { $in: filterRoles } }, // Apply dynamic filtering
//       { mail: 1, name: 1 } // Select specific fields
//     );

//     // Respond with appropriate messages
//     if (emails.length > 0) {
//       return res.status(200).json({
//         status: true,
//         message: "Fetched user emails successfully",
//         data: emails,
//       });
//     } else {
//       return res.status(404).json({
//         status: false,
//         message: "No users found",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: "Error in fetching users' emails",
//       error: error.message,
//     });
//   }
// };

//ishu corrected code

export const getAllUserEmpMail = async (req, res) => {
  try {
    const { role } = req.user; // Get logged-in user's role
    const { department } = req.user; // Get logged-in user's role
    // console.log("jaskodl", req.user);
    let filterRoles = [];

    // Apply role-based filtering
    if (role === "admin") {
      filterRoles = ["manager", "team lead", "member", "tester"];
    } else if (role === "manager") {
      filterRoles = ["team lead", "member", "tester"]; // No other managers
    } else if (role === "team lead") {
      filterRoles = ["member"];
    } else if (department === "testing") {
      filterRoles = ["manager", "team lead", "member"]; // No other testers
    } else {
      return res.status(403).json({
        status: false,
        message: "No authorization to view this data",
      });
    }

    // Fetch users based on allowed roles
    const users = await UserModel.find({ role: { $in: filterRoles } }).select(
      "name mail role"
    );

    return res.status(200).json({
      status: true,
      message: "Fetched user emails successfully",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Error fetching user emails",
    });
  }
};

export const getAllUserEmpMailForProject = async (req, res) => {
  try {
    // if (req.user?.role !== "admin") {
    //   return res.status(403).json({
    //     status: false,
    //     message: "Unauthorized access. Admins only.",
    //   });
    // }
    // Fetch all user data with only required fields

    const users = await UserModel.find(
      {},
      { mail: 1, name: 1, role: 1, admin_verify: 1, hr_approval: 1 }
    );

    // Separate users into team leads, managers, and others
    // const teamLeads = users.filter((user) => user.role === "team lead");
    const managers = users.filter((user) => user.role === "manager");
    // const others = users.filter(user => user.role !== 'team lead' && user.role !== 'manager');

    return res.status(200).json({
      status: true,
      message: "Fetched all users, team leads, and managers",

      // teamLeads: teamLeads.map(({ _id, name, mail, admin_verify }) => ({
      //   id: _id,
      //   name,
      //   mail,
      //   admin_verify,
      // })),
      managers: managers.map(
        ({ _id, mail, name, admin_verify, hr_approval }) => ({
          id: _id,
          name,
          mail,
          admin_verify,
          hr_approval,
        })
      ),

      // others: others.map(({ name, mail }) => ({ name, mail })),
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error in fetching user data",
      error: error.message,
    });
  }
};

export const getAllEmployee = async (req, res) => {
  const { id, role } = req?.user;
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

  let result = "";
  let excluding_roles = "";

  switch (role) {
    case "hr":
      excluding_roles = [role, "admin", "manager"];
      break;
    case "team lead":
      excluding_roles = [role, "admin", "manager"];
      break;
    case "manager":
      excluding_roles = ["hr", role, "admin"];
      break;
    case "admin":
      excluding_roles = [role];
      break;
    default:
      return res.status(403).json({ message: "No authorization" });
  }

  try {
    const skip = (page - 1) * limit; // Calculate the number of documents to skip
    const totalEmployees = await UserModel.countDocuments({
      role: { $nin: excluding_roles },
      is_deleted: false,
    });

    result = await UserModel.find({
      role: { $nin: excluding_roles },
      is_deleted: false,
    })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      data: result,
      totalPages: Math.ceil(totalEmployees / limit),
      currentPage: Number(page),
      totalEmployees,
      status: "success",
      message: ` ${role} authorized details`,
    });
  } catch (error) {
    res.status(500).json({
      status: "failure",
      message: "Server Error",
    });
  }
};
export const exportXLSX = async (req, res) => {
  try {
    const exact_date = new Date();
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const data = await TaskModel.find({}).populate({
      path: "assigned_to assigned_by report_to project_ownership",
      select: "mail",
    });

    // Specify the output file path
    const fileName =
      "tasks_" + formattedDate.format(exact_date).replace(/\//g, "-") + ".xlsx";

    const buffer = await exportToExcel(data);

    // Set the appropriate headers to download the file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tasks_${fileName}`
    );

    // Send the buffer as a file download
    res.write(buffer);
    res.end();
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    return res.status(200).json({
      status: "Error",
      message: "Failed to download the file",
    });
  }
};

export const importXLSX = async (req, res) => {
  if (!req.file) {
    return res.status(200).send("No file uploaded.");
  }

  // Call the function to import Excel data
  const result = await importToExcel(req.file.buffer);

  if (result.success) {
    return res.status(200).json({
      message: result.message,
      errors: result.errors || [], // Include errors if there are any
    });
  } else {
    return res.status(200).json({
      message: result.message,
      error: result.error, // Include the error message
    });
  }
}; // Replace with your actual model path

export const empid_generate = async (req, res) => {
  try {
    const { department } = req.body; // Expect department name from frontend

    const departmentCodes = {
      management: "001",
      "human-resource": "002",
      development: "003",
      design: "004",
      marketing: "005",
      testing: "006",
      "IT-Support": "007",
      others: "009",
    };

    // Validate department
    if (!department || !departmentCodes[department]) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid department" });
    }

    const departmentCode = departmentCodes[department];

    // Fetch the last employee ID for the department
    const lastEmployee = await UserModel.findOne(
      { employee_id: new RegExp(`^EVS${departmentCode}`) },
      { employee_id: 1 }
    ).sort({ employee_id: -1 });
    console.log(lastEmployee);
    // Extract the employee count part and increment
    let nextEmployeeCount = 1; // Default to 1 if no employees found
    if (lastEmployee) {
      const lastCount = parseInt(lastEmployee.employee_id.slice(6), 10); // Extract last count
      nextEmployeeCount = lastCount + 1;
    }

    const employee_id = `EVS${departmentCode}${nextEmployeeCount
      .toString()
      .padStart(3, "0")}`; // Format with leading zeros

    return res.status(200).json({
      status: true,
      employee_id,
      message: "Employee ID generated successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

// export const getEmployeesByDepartment = async (req, res) => {
//   console.log(req.user);
//   if (req.user.role === "manager" || req.user.role === "admin") {
//     const { department } = req.body; // Get department from query params

//     if (!department) {
//       return res.status(400).json({ message: "Department is required" });
//     }

//     try {
//       const employees = await UserModel.find({
//         department,
//         is_deleted: false,
//       }).select("-password"); // Exclude password from the response

//       if (employees.length === 0) {
//         return res
//           .status(404)
//           .json({ message: "No employees found in this department" });
//       }

//       const roleCounts = await UserModel.aggregate([
//         {
//           $match: {
//             department,
//             is_deleted: false,
//           },
//         },
//         {
//           $group: {
//             _id: "$role",
//             role: { $first: "$role" },
//             count: { $sum: 1 },
//           },
//         },
//         {
//           $project: {
//             _id: 0, // Remove _id
//             role: "$_id", // Rename _id to role
//             count: 1,
//           },
//         },
//       ]);

//       return res.status(200).json({
//         status: "success",
//         department,
//         totalEmployees: employees.length,
//         roleCounts,
//         employeeList: employees,
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({
//         status: "failure",
//         message: "Server Error",
//       });
//     }
//   } else {
//     return res.status(403).json({ message: "Access Denied" });
//   }
// };

export const getEmployeesByDepartment = async (req, res) => {
  console.log(req.user);

  if (req.user.role === "manager" || req.user.role === "admin") {
    let { department } = req.body;

    // If user is a manager, restrict them to their own department
    if (req.user.role === "manager") {
      department = req.user.department;
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    try {
      const filter = {
        department,
        is_deleted: false,
      };

      // If user is a manager, exclude other managers
      if (req.user.role === "manager") {
        filter.role = { $ne: "manager" }; // Exclude managers
      }

      const employees = await UserModel.find(filter).select("-password"); // Exclude password from the response

      if (employees.length === 0) {
        return res
          .status(404)
          .json({ message: "No employees found in this department" });
      }

      const roleCounts = await UserModel.aggregate([
        {
          $match: filter, // Apply the same filtering
        },
        {
          $group: {
            _id: "$role",
            role: { $first: "$role" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0, // Remove _id
            role: "$_id", // Rename _id to role
            count: 1,
          },
        },
      ]);

      return res.status(200).json({
        status: "success",
        department,
        totalEmployees: employees.length,
        roleCounts,
        employeeList: employees,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "failure",
        message: "Server Error",
      });
    }
  } else {
    return res.status(403).json({ message: "Access Denied" });
  }
};