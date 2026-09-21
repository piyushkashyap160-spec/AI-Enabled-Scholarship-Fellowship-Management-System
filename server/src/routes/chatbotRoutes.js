import express from 'express';
import { handleChatbotMessage } from '../controllers/chatbotController.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
    }
    return 'development_only_secret_key_change_in_env';
  }
  return secret;
};

// Optional auth middleware for chatbot: supports logged-in and public guest queries
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch {}
  }
  next();
};

router.post('/message', optionalAuth, handleChatbotMessage);

export default router;
