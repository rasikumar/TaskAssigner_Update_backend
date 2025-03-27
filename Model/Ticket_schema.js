
import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project', // Referencing Project model
      required: true,
    },

    tasks: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
 

    raised_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Referencing User model
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Referencing User model
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopen'],
      default: 'Open',
    },
    severity: {
      type: String,
      enum: ['Minor', 'Major', 'Critical'],
      default: 'Major',
    },
    main_category: {
      type: String,
      required: true,
    },
    sub_category: {
      type: String,
      required: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    start_date: { 
      type: Date,
      default: Date.now,},
    end_date: { 
      type: Date,
    default: Date.now,},
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
    
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


export const Ticket = mongoose.model('Ticket', TicketSchema);
// export default mongoose.model('Ticket', TicketSchema);




