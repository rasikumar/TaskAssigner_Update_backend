import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env["MONGO_DB"]);
    console.log("Database Created Successfully");
  } catch (error) {
    console.log("Error While Creating Database", error);
  }
};

export default connectDatabase;



