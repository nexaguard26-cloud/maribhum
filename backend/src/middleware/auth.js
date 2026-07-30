import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'يرجى تسجيل الدخول أولاً'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'جلسة غير صالحة'
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ليس لديك صلاحية لهذا الإجراء'
      });
    }
    next();
  };
};
