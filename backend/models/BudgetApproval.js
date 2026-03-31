import mongoose from 'mongoose';

// Budget approval requests (user → manager). tripId = RFQ _id as string.
const budgetApprovalSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, index: true },
    /** User-facing code (form jaisa), tripId Mongo RFQ _id rehta hai */
   
budget:   { type: Number, default: 0  },
    tripName: { type: String, default: '' },
    requestedBy: { type: String, default: 'user' },
    budget: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    planItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    destinations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    numberOfAdults: { type: Number, default: 1 },
    numberOfChildren: { type: Number, default: 0 },
    numberOfInfants: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    sentAt: { type: Date, default: Date.now },
    approvedBudget: { type: Number, default: null },
    managerComment: { type: String, default: '' },
    actionAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('BudgetApproval', budgetApprovalSchema);
