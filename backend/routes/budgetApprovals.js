import express        from 'express';
import BudgetApproval from '../models/BudgetApproval.js';
const router = express.Router();
 // aapka existing RFQ model

// ── POST /api/budget-approvals ──────────────────────────────
// User "Send Budget Approval" click kare toh
router.post('/', async (req, res) => {
  try {
    const {
      tripId,       // rfq._id
      rfqId,        // short display id (optional)
      tripName,
      requestedBy,  // dummy: 'user'
      budget,       // rfq.budget
      grandTotal,   // plan ka calculated total
      planItems,    // pura plan array
      destinations,
      numberOfAdults,
      numberOfChildren,
      numberOfInfants,
    } = req.body;

    if (!tripId) {
      return res.status(400).json({ success: false, message: 'tripId required' });
    }

    // Agar pehle se exist karta hai toh update karo (re-send case)
    const existing = await BudgetApproval.findOne({ tripId });

    if (existing) {
      // Sirf pending ya rejected ko re-send allow karo
      existing.budget       = budget;
      existing.grandTotal   = grandTotal;
      existing.planItems    = planItems;
      if (rfqId != null && rfqId !== '') existing.rfqId = String(rfqId);
      existing.status       = 'pending';
      existing.sentAt       = new Date();
      existing.approvedBudget  = null;
      existing.managerComment  = '';
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const approval = new BudgetApproval({
      tripId,
      rfqId: rfqId != null ? String(rfqId) : '',
      tripName,
      requestedBy: requestedBy || 'user',
      budget,
      grandTotal,
      planItems,
      destinations,
      numberOfAdults:   numberOfAdults   || 1,
      numberOfChildren: numberOfChildren || 0,
      numberOfInfants:  numberOfInfants  || 0,
      status: 'pending',
      sentAt: new Date(),
    });

    await approval.save();
    res.status(201).json({ success: true, data: approval });

  } catch (err) {
    console.error('Budget approval POST error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/budget-approvals?status=pending ────────────────
// Manager ki list — pending/approved/rejected sab
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const approvals = await BudgetApproval
      .find(filter)
      .sort({ sentAt: -1 }); // Latest pehle

    res.json({ success: true, data: approvals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/budget-approvals/:tripId ───────────────────────
// User polling — apni trip ka status check kare
router.get('/:tripId', async (req, res) => {
  try {
    const approval = await BudgetApproval.findOne({ tripId: req.params.tripId });
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/budget-approvals/:tripId ─────────────────────
// Manager approve/reject kare
router.patch('/:tripId', async (req, res) => {
  try {
    const { status, approvedBudget, managerComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const approval = await BudgetApproval.findOne({ tripId: req.params.tripId });
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    approval.status          = status;
    approval.approvedBudget  = approvedBudget || approval.budget;
    approval.managerComment  = managerComment || '';
    approval.actionAt        = new Date();

    await approval.save();
    res.json({ success: true, data: approval });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
export default router;
