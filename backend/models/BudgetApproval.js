import mongoose from 'mongoose';

const budgetApprovalSchema = new mongoose.Schema({
  tripId:      { type: String, required: true, index: true },
  rfqId:       { type: String, default: '' },
  tripName:    { type: String, default: '' },
  requestedBy: { type: String, default: '' },
  assignedTo:  { type: String, default: '' },
  budget:      { type: Number, default: 0 },
  grandTotal:  { type: Number, default: 0 },
  planItems:   { type: [mongoose.Schema.Types.Mixed], default: [] },
  destinations:{ type: [mongoose.Schema.Types.Mixed], default: [] },
  numberOfAdults:   { type: Number, default: 1 },
  numberOfChildren: { type: Number, default: 0 },
  numberOfInfants:  { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  sentAt:         { type: Date, default: Date.now },
  userNote:       { type: String, default: '' },
  approvedBudget: { type: Number, default: null },
  managerComment: { type: String, default: '' },
  actionAt:       { type: Date, default: null },
}, { timestamps: true });

// ERROR YAHAN THA: Bina is line ke 'BudgetApproval' variable exist hi nahi karta
const BudgetApproval = mongoose.model('BudgetApproval', budgetApprovalSchema);

export default BudgetApproval;