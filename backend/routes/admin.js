// routes/admin.js
// Admin-only routes — role: 'hr' only
import express from 'express';
import User from '../models/User.js';
import RFQ from '../models/RFQ.js';
import BudgetApproval from '../models/BudgetApproval.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/admin/stats ─────────────────────────────────────
// Dashboard ke top cards ke liye
router.get('/stats', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalTrips,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      allApprovals,
    ] = await Promise.all([
      User.countDocuments(),
      RFQ.countDocuments(),
      BudgetApproval.countDocuments({ status: 'pending' }),
      BudgetApproval.countDocuments({ status: 'approved' }),
      BudgetApproval.countDocuments({ status: 'rejected' }),
      BudgetApproval.find({ status: 'approved' }, 'grandTotal'),
    ]);

    const totalSpend = allApprovals.reduce((sum, a) => sum + (a.grandTotal || 0), 0);

    // Role breakdown
    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const roleMap = roleCounts.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    // Trip status breakdown
    const tripStatuses = await RFQ.aggregate([
      { $group: { _id: '$reviewStatus', count: { $sum: 1 } } },
    ]);
    const tripStatusMap = tripStatuses.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {});

    // Top 5 destinations
    const topDest = await RFQ.aggregate([
      { $match: { destinations: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: { path: '$destinations', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$destinations.destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Monthly trip count (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrips = await RFQ.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        pendingApprovals,
        approvedApprovals,
        rejectedApprovals,
        totalSpend,
        roleMap,
        tripStatusMap,
        topDestinations: topDest,
        monthlyTrips,
      },
    });
  } catch (err) {
    console.error('[AdminStats] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────────
// Saare users with trip count
router.get('/users', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    // Har user ke liye trip count
    const uids = users.map((u) => u.uid);
    const tripCounts = await RFQ.aggregate([
      { $match: { createdBy: { $in: uids } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);
    const tripMap = tripCounts.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {});

    const enriched = users.map((u) => ({
      ...u,
      tripCount: tripMap[u.uid] || 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/trips ─────────────────────────────────────
// Saari trips with creator name
router.get('/trips', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (status) filter.reviewStatus = status;

    const trips = await RFQ.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    // Creator names join
    const uids = [...new Set(trips.map((t) => t.createdBy).filter(Boolean))];
    const users = await User.find({ uid: { $in: uids } }, 'uid name email').lean();
    const userMap = users.reduce((acc, u) => {
      acc[u.uid] = u.name || u.email;
      return acc;
    }, {});

    const enriched = trips.map((t) => ({
      ...t,
      createdByName: userMap[t.createdBy] || 'Unknown',
    }));

    const total = await RFQ.countDocuments(filter);

    res.json({ success: true, data: enriched, total });
  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/approvals ─────────────────────────────────
// Saare budget approvals with names
router.get('/approvals', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const approvals = await BudgetApproval.find(filter)
      .sort({ sentAt: -1 })
      .lean();

    const uids = [
      ...new Set([
        ...approvals.map((a) => a.requestedBy),
        ...approvals.map((a) => a.assignedTo),
      ].filter(Boolean)),
    ];
    const users = await User.find({ uid: { $in: uids } }, 'uid name email').lean();
    const userMap = users.reduce((acc, u) => {
      acc[u.uid] = u.name || u.email;
      return acc;
    }, {});

    const enriched = approvals.map((a) => ({
      ...a,
      requestedByName: userMap[a.requestedBy] || 'Unknown',
      assignedToName: userMap[a.assignedTo] || 'Unknown',
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:uid/role ─────────────────────────
// User ka role change karo
router.patch('/users/:uid/role', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['hr', 'manager', 'employee', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { role },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:uid/budget ───────────────────────
// User ka budget limit change karo
router.patch('/users/:uid/budget', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
  try {
    const { annualBudget, perTripLimit } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      {
        $set: {
          'profile.annualBudget': annualBudget,
          'profile.perTripLimit': perTripLimit,
        },
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;