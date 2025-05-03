import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import evaluateBias from './controllers/biasController.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/evaluate-bias', evaluateBias);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("HF_API_TOKEN exists?", !!process.env.HF_API_TOKEN);

  console.log(`Bias Score Tool running on http://localhost:${PORT}`);
});
