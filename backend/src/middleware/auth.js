import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'resqmeal_jwt_super_secret_key_change_in_production';

// Verify JWT bearer token and attach user info to request
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Restrict access to specific roles
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
  }
  next();
};
