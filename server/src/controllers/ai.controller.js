const aiService = require('../services/ai.service');

/**
 * Handle AI Assistant requests
 * POST /api/ai/assistant
 */
async function getAssistantResponse(req, res, next) {
  try {
    const { messages, location, restaurantId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one message is required in the messages array'
        }
      });
    }

    const userName = req.user?.name || req.user?.email?.split('@')[0] || null;

    const result = await aiService.getDiningRecommendation({
      messages,
      location,
      restaurantId: restaurantId ? Number(restaurantId) : null,
      userName
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssistantResponse
};
