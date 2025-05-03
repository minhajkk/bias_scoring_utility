import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config(); // Load .env

const MODELS = {
  zeroShot: 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
  hateSpeech: 'https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dynabench-r4-target'
};

const HF_API_TOKEN = `Bearer ${process.env.HF_API_TOKEN}`;

export async function callHateSpeechClassifier(text) {
  const headers = {
    Authorization: HF_API_TOKEN,
    'Content-Type': 'application/json'
  };

  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.post(
        MODELS.hateSpeech,
        { inputs: text },
        { headers }
      );

      const predictionArray = Array.isArray(response.data) ? response.data[0] : [];
      const hatePrediction = predictionArray.find(p => p.label.toLowerCase() === 'hate');
      const score = hatePrediction?.score || 0;

      return {
        model: 'hate-speech',
        label: hatePrediction?.label || 'unknown',
        score,
        flagged: score > 0.7,
        reason: score > 0.7 ? 'Detected hate speech' : 'No hate speech detected'
      };
    } catch (err) {
      if (err.response?.status === 503) {
        console.log(`Model cold starting... retrying (${i + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        throw err;
      }
    }
  }

  throw new Error('Hate speech model unavailable after retries');
}

export async function callZeroShotClassifier(text) {
  const response = await axios.post(
    MODELS.zeroShot,
    {
      inputs: text,
      parameters: {
        candidate_labels: ["toxic", "gender bias", "racial bias", "cultural bias", "age bias"]
      }
    },
    {
      headers: {
        Authorization: HF_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  const scores = Object.fromEntries(response.data.labels.map((label, i) => [label, response.data.scores[i]]));
  return {
    model: 'zero-shot',
    scores,
    flagged: Object.values(scores).some(score => score > 0.7),
    reason: Object.entries(scores).filter(([_, s]) => s > 0.7).map(([label]) => label).join(', ') || 'No major bias detected'
  };
}

export async function scoreBias(text, context = {}) {
  const modelChoice = context.model || 'zeroShot';
  if (modelChoice === 'hateSpeech') {
    return await callHateSpeechClassifier(text);
  } else {
    return await callZeroShotClassifier(text);
  }
}
