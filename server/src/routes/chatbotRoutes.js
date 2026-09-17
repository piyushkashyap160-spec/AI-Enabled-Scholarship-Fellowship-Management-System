import express from 'express';
import { handleChatbotMessage } from '../controllers/chatbotController.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Optional auth middleware for chatbot: supports logged-in and public guest queries
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mota_sih_26239_super_secure_jwt_secret_key_2026');
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch {}
  }
  next();
};

router.post('/message', optionalAuth, handleChatbotMessage);

export default router;
