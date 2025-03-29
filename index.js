// import express from "express";
// import cors from "cors";
// import connectDatabase from "./Model/db.js";
// import userRoute from "./Routes/User_Route.js";
// import adminRoute from "./Routes/Admin_Route.js";
// import bodyParser from "body-parser";
// import path from "path";
// import url from "url";
// import "./Service/Milestone_service.js"; // Adjust the path based on your folder structure

// // import ticketRoute from "./Routes/Ticket_Route.js";

// import dotenv from "dotenv";
// dotenv.config();

// const app = express();
// const port = 4001;

// app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));


// app.use(bodyParser.json());

// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true })); // For parsing URL-encoded data

// // Get the directory name using import.meta.url
// const __filename = url.fileURLToPath(import.meta.url);

// const __dirname = path.dirname(__filename);

// // Serve static files from the 'uploads' directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// // Serving 'uploads' from correct location (move up two levels)
// // app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/uploads", express.static("uploads"));

// // // Serving 'uploads' from correct location (move up two levels)
// // app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
// app.use("/user", userRoute);

// app.use("/admin", adminRoute);

// // app.use("/ticket", ticketRoute);

// connectDatabase();

// app.listen({ port }, () => {
//   console.log(`server running successfully ${port}`);
// });

// import express from "express";
// import cors from "cors";
// import connectDatabase from "./Model/db.js";
// import userRoute from "./Routes/User_Route.js";
// import adminRoute from "./Routes/Admin_Route.js";
// import bodyParser from "body-parser";
// import path from "path";
// import url from "url";
// import multer from "multer";  // Add multer for file uploads
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// const port = 4001;

// app.use(cors("*"));

// // Middleware Order Fix
// app.use(express.json()); // Parse JSON requests
// app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
// app.use(bodyParser.json()); // Body parser for JSON
// app.use(bodyParser.urlencoded({ extended: true })); // Body parser for form data

// // Get the directory name using import.meta.url
// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve uploaded files from the 'uploads' folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Routes
// app.use("/user", userRoute);
// app.use("/admin", adminRoute);

// // Connect Database
// connectDatabase();

// app.listen(port, () => {
//   console.log(`Server running successfully on port ${port}`);
// });


import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Local imports
import connectDatabase from "./Model/db.js";
import userRoute from "./Routes/User_Route.js";
import adminRoute from "./Routes/Admin_Route.js";
// import ticketRoute from "./Routes/Ticket_Route.js";
import "./Service/Milestone_service.js"; 

const app = express();
const port = 4004;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/user", userRoute);
app.use("/admin", adminRoute);
// app.use("/ticket", ticketRoute);

// Database Connection
connectDatabase();

app.use(express.static(path.join(__dirname, "/dist")));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
// Start Server
app.listen(port, () => {
  console.log(`Server running successfully on port ${port}`);
});
