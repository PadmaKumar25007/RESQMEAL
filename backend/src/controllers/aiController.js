const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/ai/predict — proxy YOLO inference from the Express backend
export const predictFood = async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', filename = 'food.jpg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 is required' });
    }

    const aiResponse = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, filename }),
    });

    const aiData = await aiResponse.json().catch(() => null);

    if (!aiResponse.ok) {
      return res.status(aiResponse.status === 422 ? 400 : aiResponse.status).json({
        success: false,
        message: aiData?.detail || 'AI inference failed',
      });
    }

    res.json(aiData);
  } catch (error) {
    console.error('AI proxy error:', error.message);
    res.status(502).json({ success: false, message: 'AI service unavailable' });
  }
};

// GET /api/ai/health — proxy AI service health check
export const aiHealth = async (_req, res) => {
  try {
    const aiResponse = await fetch(`${AI_SERVICE_URL}/health`);
    const aiData = await aiResponse.json().catch(() => null);
    res.json({ success: true, ai: aiData, service: 'resqmeal-api' });
  } catch (error) {
    res.status(502).json({ success: false, message: 'AI service unavailable' });
  }
};
