import { scoreBias } from '../services/biasService.js';

const evaluateBias = async (req, res) => {
  const { text, contextType, model } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const result = await scoreBias(text, {
      source: contextType,
      model
    });
    res.json(result);
  } catch (err) {
    console.error('Error evaluating bias:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default evaluateBias;