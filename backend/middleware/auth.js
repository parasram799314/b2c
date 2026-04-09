// middleware/auth.js
import admin from 'firebase-admin';
import User from '../models/User.js'

// Firebase admin initialize (sirf ek baar)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
  }
}

// Role check middleware factory
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ uid: req.uid });
      if (!user) {
        console.log(`[Auth] User ${req.uid} not found in MongoDB`);
        return res.status(404).json({ success: false, message: `User record not found in database for UID: ${req.uid.slice(-6)}. Please logout and login again.` });
      }
      if (!roles.includes(user.role)) {
        console.log(`[Auth] Access denied for ${user.role}. Required: ${roles.join(',')}`);
        return res.status(403).json({ success: false, message: `Access denied. Role '${user.role}' does not have permission.` });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error during role check' });
    }
  };
}