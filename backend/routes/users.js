// routes/users.js — HR ke liye
import express from 'express';
import User from '../models/User.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Pehli baar login pe user create/fetch karo
router.post('/sync', verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.uid });
    if (!user) {
      // NEW: Auto-create user with email prefix as name and 'user' role
      const defaultName = req.email ? req.email.split('@')[0] : 'User';
      user = await User.create({
        uid: req.uid,
        email: req.email,
        name: req.body.name || defaultName,
        role: 'user',
        createdAt: new Date(),
      });
    } else if (req.body.name && !user.name) {
      // Name update karein agar backend mein empty hai
      user.name = req.body.name;
      await user.save();
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// HR — saare users dekho
router.get('/', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// HR — kisi ka manager assign karo
router.patch('/:uid/assign-manager', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { managerId } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { managerId },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Chat Token Routes ────────────────────────────────────────────────────────

const DAILY_TOKEN_LIMIT = 2000;

// GET /api/users/chat-tokens — frontend pe tokens dikhane ke liye
// routes/rfqs.js mein /chat route ko aise badlein:
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { itinerary, destinations, message } = req.body;
    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Reset Logic (Daily)
    const now = new Date();
    const last = new Date(user.chatTokens.lastReset);
    const isNewDay = now.toDateString() !== last.toDateString();

    if (isNewDay) {
      user.chatTokens.used = 0;
      user.chatTokens.lastReset = now;
    }

    if (user.chatTokens.used >= DAILY_TOKEN_LIMIT) {
      return res.status(403).json({ success: false, message: 'Limit reached' });
    }

    const result = await chatWithItinerary({ itinerary, destinations, message });
    const reply = result.reply;

    // Token calculation (input + output)
    const totalUsedInThisRequest = Math.ceil((message.length + reply.length) * 0.25);
    
    user.chatTokens.used = Math.min(user.chatTokens.used + totalUsedInThisRequest, DAILY_TOKEN_LIMIT);
    await user.save();

    res.json({
      success: true,
      reply,
      used: user.chatTokens.used, // Naya updated count bhejein
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - user.chatTokens.used)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/chat-tokens — frontend pe tokens dikhane ke liye
router.get('/chat-tokens', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const last = new Date(user.chatTokens.lastReset);

    // Naya din hai toh reset karo
    if (now.toDateString() !== last.toDateString()) {
      user.chatTokens.used = 0;
      user.chatTokens.lastReset = now;
      await user.save();
    }

    res.json({
      success: true,
      used: user.chatTokens.used,
      remaining: Math.max(0, 2000 - user.chatTokens.used),
      limit: 2000,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Find manager name if managerId exists
    let managerName = '';
    let managerUid = '';

    if (user.managerId) {
      const manager = await User.findOne({ uid: user.managerId }, 'uid name email');
      if (manager) {
        managerName = manager.name || manager.email;
        managerUid = manager.uid;
      }
    }

    // Fallback to profile.reportingManager or profile.reviewer if managerName is still empty
    if (!managerName && (user.profile?.reportingManager || user.profile?.reviewer)) {
      const reporting = user.profile.reportingManager || user.profile.reviewer;
      // 1. Try treating it as a UID
      const mByUid = await User.findOne({ uid: reporting }, 'uid name email');
      if (mByUid) {
        managerName = mByUid.name || mByUid.email;
        managerUid = mByUid.uid;
      } else {
        // 2. Try treating it as a Name
        const mByName = await User.findOne({ 
          role: 'manager', 
          $or: [
            { name: new RegExp('^' + reporting + '$', 'i') },
            { email: new RegExp('^' + reporting + '$', 'i') }
          ]
        }, 'uid name email');
        
        if (mByName) {
          managerName = mByName.name || mByName.email;
          managerUid = mByName.uid;
        } else {
          // 3. Just use the string as-is
          managerName = reporting;
        }
      }
    }

    res.json({ success: true, data: { ...user.toObject(), managerName, managerUid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// 2. Update Profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const updateData = req.body; // Frontend se pura profile object aayega
    const user = await User.findOneAndUpdate(
      { uid: req.uid },
      { $set: { profile: updateData, name: updateData.fullName || "" } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/chat-tokens/deduct — message send hone ke baad tokens kaato
router.post('/chat-tokens/deduct', verifyToken, async (req, res) => {
  try {
    const { tokensToDeduct } = req.body;
    if (!tokensToDeduct || tokensToDeduct <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid token count' });
    }

    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Yahan bhi same-day check — safety ke liye
    const now = new Date();
    const last = new Date(user.chatTokens.lastReset);
    const sameDay =
      now.getFullYear() === last.getFullYear() &&
      now.getMonth()    === last.getMonth()    &&
      now.getDate()     === last.getDate();

    if (!sameDay) {
      user.chatTokens.used      = 0;
      user.chatTokens.lastReset = now;
    }

    // Limit cross na ho
    const newUsed = Math.min(user.chatTokens.used + tokensToDeduct, DAILY_TOKEN_LIMIT);
    user.chatTokens.used = newUsed;
    await user.save();

    res.json({
      success:   true,
      used:      newUsed,
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - newUsed),
      limit:     DAILY_TOKEN_LIMIT,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── /Chat Token Routes ───────────────────────────────────────────────────────
// HR — role change karo
router.patch('/:uid/role', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { role },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;