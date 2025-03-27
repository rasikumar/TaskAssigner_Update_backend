import { TicketModel } from "../Model/Ticket_scheme_old.js";

export const createTicket = async (req, res) => {
  const { id } = req.user;

  const { title, description, main_category, sub_category, status, priority } =
    req?.body;
  console.log(req.user);
  if (!title && !description) {
    return res.status(200).json({ message: "Please Enter The Requried field" });
  } else {
    const ticketdata = {
      ticket_title: title,
      ticket_description: description,
      main_category: main_category,
      sub_category: sub_category,
      created_by: id,
      status: status,
      priority: priority,
    };
    //   console.log(ticketdata);
    await TicketModel.create(ticketdata)
      .then((CreatedData) => {
        if (CreatedData) {
          return res.status(200).json({
            status: true,
            message: "Ticket Created Successfully",
            data: CreatedData,
          });
        }
      })
      .catch((err) => {
        return res.status(200).json({
          status: false,
          message: "Invalid Ticket Creation",
        });
      });
  }
};

export const updateTicket = async (req, res) => {
  const {
    _id,
    title,
    description,
    main_category,
    sub_category,
    status,
    priority,
  } = req?.body;

  try {
    if (req.user?.role !== "admin") {
      return res
        .status(200)
        .json({ status: false, message: "No Authorization" });
    } else {
      const ticketdata = {
        ticket_title: title,
        ticket_description: description,
        main_category: main_category,
        sub_category: sub_category,
        status: status,
        priority: priority,
      };
      console.log(ticketdata);
      await TicketModel.findOneAndUpdate({ _id: _id }, ticketdata).then(
        (UpdatedTicket) => {
          console.log(UpdatedTicket);
          if (!UpdatedTicket) {
            return res
              .status(200)
              .json({ status: false, message: "Invalid Updation" });
          } else {
            return res
              .status(200)
              .json({ status: true, message: "Successfully Updated" });
          }
        }
      );
    }
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Error in Updating Ticket" });
  }
};

export const deleteTicket = async (req, res) => {
  const { _id } = req?.body;
  try {
    if (req.user?.role == "admin" || "member") {
      await TicketModel.deleteOne({ _id: _id });
      return res
        .status(200)
        .json({ status: true, message: "Ticket Deleted Successfully" });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ status: false, message: "Error in deleting Ticket" });
  }
};

export const getAllTicket = async (req, res) => {
  try {
    if (req.user?.role == "admin") {
      await TicketModel.find({}).then((AllTickets) => {
        if (AllTickets) {
          return res.status(200).json({
            status: true,
            message: "Fetching All Tickets",
            data: AllTickets,
          });
        } else {
          return res
            .status(200)
            .json({ status: false, message: "No Ticket Found" });
        }
      });
    }
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Error in Fetching Data" });
  }
};

export const getTicketById = async (req, res) => {
  const { _id } = req?.body;
  try {
    await TicketModel.find({ _id: _id }).then((ticket) => {
      if (ticket.length > 0) {
        return res.status(200).json({
          status: true,
          message: "Successfully Fetching Ticket",
          data: ticket,
        });
      } else {
        return res
          .status(200)
          .json({ status: false, message: "No Ticket Found" });
      }
    });
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Error in Fetching Ticket" });
  }
};

export const getTicketByCategory = async (req, res) => {
  const { category } = req?.body;
  try {
    if (req.user.role == "admin") {
      await TicketModel.find({ main_category: category })
        .then((ticketList) => {
          if (ticketList.length > 0) {
            console.log(ticketList);
            return res.status(200).json({
              status: true,
              message: "Successfully Listed By Category",
              data: ticketList,
            });
          } else {
            return res
              .status(200)
              .json({ status: false, message: "No Tickets Found" });
          }
        })
        .catch((err) => {
          return res
            .status(200)
            .json({ status: false, message: "Error in Fetching Data" });
        });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "NO Authorization" });
    }
  } catch {
    return res
      .status(200)
      .json({ status: false, message: "Internal Server Error" });
  }
};
