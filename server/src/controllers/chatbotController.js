import { processChatbotMessage } from '../services/chatbotService.js';

export const handleChatbotMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const response = await processChatbotMessage(userId, message);

    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    next(error);
  }
};
