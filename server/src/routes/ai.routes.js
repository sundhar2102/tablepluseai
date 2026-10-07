const express = require('express');
const jwt = require('jsonwebtoken');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// Optional authentication middleware
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token && process.env.JWT_SECRET) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Keep going without user context
    }
  }
  next();
}

/**
 * POST /api/ai/assistant
 * Body: { messages: [{ role: 'user', content: '...' }], location: { lat, lng }, restaurantId: 1 }
 */
router.post('/ai/assistant', optionalAuth, aiController.getAssistantResponse);

module.exports = router;
