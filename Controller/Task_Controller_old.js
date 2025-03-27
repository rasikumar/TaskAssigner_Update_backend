import { TaskModel } from "../Model/Task_scheme.js";

export const createTask = async (req, res) => {
  console.log(req.body);
  const {
    project_title,
    project_description,
    project_ownership,
    assigned_to,
    assigned_by,
    report_to,
    status,
    priority,
    start_date,
    end_date,
    task_description,
  } = req.body;
  // const status = "pending";
  const exact_date = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  // const due_date = formattedDate.format(exact_date);
  // const starting_date =  formattedDate.format(start_date)

  const { id, role } = req.user;
  if (
    !project_title ||
    !project_description ||
    !project_ownership ||
    // !assigned_by ||
    !assigned_to ||
    !report_to ||
    !start_date ||
    !end_date
  ) {
    res.status(200).json({
      status: false,
      message: "Please Enter requried Field for Task Creation",
    });
  } else if (role == "admin" || "team lead" || "manager") {
    await TaskModel.create({
      project_title,
      project_description,
      project_ownership,
      assigned_to,
      assigned_by: id,
      report_to,
      status,
      priority,
      start_date,
      end_date,
      task_description,
    })
      .then((task) => {
        res.status(200).json({
          status: "Success",
          message: "task created successfully",
          data: task,
        });
      })
      .catch((err) => {
        res.status(200).json({
          status: "failure",
          message: "Failure in Task Creation",
        });
      });
  } else {
    return res.status(200).json({ status: false, message: "No Authorization" });
  }
};

export const deleteTask = async (req, res) => {
  const { id, role } = req.body;
  // console.log(req.role);

  // try {
  if (role == "admin") {
    const is_deleted = true;
    await TaskModel.findByIdAndUpdate({ _id: id }, { is_deleted: is_deleted })
      .then((deletedTask) => {
        return res
          .status(200)
          .json({ status: true, message: "Successfully Deleted" });
      })
      .catch((err) => {
        return res
          .status(200)
          .json({ status: false, message: "Invaild Deletion" });
      });
  } else {
    return res.status(200).json({ status: false, message: "No Authorization" });
  }
  // } catch {
  //   return res
  //     .status(200)
  //     .json({ status: false, message: "Internal Server Error" });
  // }
};

export const editTaskStatus = async (req, res) => {
  const id = req?.body?._id;
  const Task_status = req?.body?.status;
  const task_dec = req?.body?.task_description;
  console.log(req?.body?.status);

  if (!id) {
    return res.status(400).json({ status: false, message: "Invalid Update" });
  }

  try {
    const result = await TaskModel.updateOne(
      { _id: id },
      { $set: { status: Task_status, task_description: task_dec } }
    );

    console.log(result);

    if (result.nModified === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found or not updated" });
    }

    return res
      .status(200)
      .json({ status: "success", message: "Task Updated Successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getAllTask = async (req, res) => {
  try {
    const tasks = await TaskModel.find({ is_deleted: false });
    // console.log("tasks", tasks);

    return res.status(200).json({
      status: true,
      message: "Get All Tasks",
      data: tasks,
    });
  } catch (err) {
    console.error("Error fetching tasks:", err);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

export const getTask = async (req, res) => {
  const { id } = req?.body;
  try {
    await TaskModel.find({ _id: id, is_deleted: false })
      .then((task) => {
        if (!task) {
          return res
            .status(200)
            .json({ status: false, message: "Task Not Found" });
        } else {
          return res.status(200).json({
            status: true,
            message: "Successfully Data Fetched",
            data: task,
          });
        }
      })
      .catch((error) => {
        return res
          .status(200)
          .json({ status: false, message: "Error while Finding User" });
      });
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const updateTask = async (req, res) => {
  const {
    project_title,
    project_description,
    project_ownership,
    assigned_to,
    assigned_by,
    report_to,
    status,
    priority,
    start_date,
    end_date,
    task_description,
  } = req?.body;
  console.log(req.body);
  if (req.user.role == "admin") {
    const updateTask = {
      project_title,
      project_description,
      project_ownership,
      assigned_to,
      assigned_by,
      report_to,
      status,
      priority,
      start_date,
      end_date,
      task_description,
    };
    await TaskModel.findByIdAndUpdate({ _id: req.body.id }, updateTask, {
      new: true,
    }).then((updatedTask) => {
      return res.status(200).json({
        status: true,
        message: "Updated Successfully",
        data: updateTask,
      });
    });
  } else {
    return res
      .status(200)
      .json({ status: "false", message: "No authoraization" });
  }
};
   
export const create_skill_Improvement = async (req, res) => {
  const { id, message } = req?.body;
  try {
    if (req.user.role == "employee") {
      await TaskModel.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            skill_improvement: {
              comments: {
                sentFromId: req.user.id,
                message: message,
                date: new Date(),
              },
            },
          },
        },
        { new: true }
      )
        .then((createdSkill) => {
          return res.status(200).json({
            status: true,
            message: "Created Skill Improvement Successfully",
            data: createdSkill,
          });
        })
        .catch((err) => {
          return res
            .status(200)
            .json({ status: true, message: "Error Filling Skill Improvrment" });
        });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "No Authorization" });
    }
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const update_skill_Improvement = async (req, res) => {
  const { id, message, skills_approval_status } = req?.body;
  let updateQuery = {};
  try {
    if (req.user.role == "team lead" || req.user.role === "manager") {
      updateQuery = {
        $push: {
          skill_improvement: {
            comments: {
              sentFromId: req.user.id,
              message: message,
              date: new Date(),
            },
          },
        },
      };
      if (req.user.role === "manager" || req.user.role === "admin") {
        updateQuery.$set = {
          skills_approval_status: skills_approval_status || "", //"Pending", "Approved", "Rejected"
          skill_imp_reviewed_by: req.user.id || "",
        };
      }
    } else {
      return res
        .status(200)
        .json({ status: false, message: "No Authorization" });
    }
    await TaskModel.findByIdAndUpdate({ _id: id }, updateQuery, {
      new: true,
    })
      .then((updateSkill) => {
        return res.status(200).json({
          status: true,
          message: "Skill Improvement added successfully",
          data: updateSkill,
        });
      })
      .catch((err) => {
        return res
          .status(200)
          .json({ status: false, message: "Error in Creating" });
      });
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const create_growth_assessment = async (req, res) => {
  const { id, message } = req?.body;
  try {
    if (req.user.role == "employee") {
      await TaskModel.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            growth_assessment: {
              comments: {
                sentFromId: req.user.id,
                message: message,
                date: new Date(), // Current date and time
              },
            },
          },
        },
        { new: true }
      )
        .then((createdGrowth) => {
          return res.status(200).json({
            status: true,
            message: "Growth Assessment Created Successfully",
            data: createdGrowth,
          });
        })
        .catch((err) => {
          return res
            .status(200)
            .json({ status: true, message: "Invalid Submission" });
        });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "No Authorization" });
    }
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const update_growth_assessment = async (req, res) => {
  const { id, message } = req?.body;
  let updateQuery = {};
  try {
    if (
      req.user.role == "team lead" ||
      req.user.role === "manager" ||
      req.user.role === "admin"
    ) {
      updateQuery = {
        $push: {
          growth_assessment: {
            comments: {
              sentFromId: req.user.id,
              message: message,
              date: new Date(),
            },
          },
        },
      };
    } else {
      return res
        .status(200)
        .json({ status: false, message: "No Authorization" });
    }
    await TaskModel.findByIdAndUpdate({ _id: id }, updateQuery, {
      new: true,
    })
      .then((updateSkill) => {
        return res.status(200).json({
          status: true,
          message: "Growth Assessment update successfully",
          data: updateSkill,
        });
      })
      .catch((err) => {
        return res
          .status(200)
          .json({ status: false, message: "Error in Creating" });
      });
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};
