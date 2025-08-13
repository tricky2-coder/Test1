
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pg.js';
import surveysRouter from './routes/surveys.js';
import responsesRouter from './routes/responses.js';
import whatsappRouter from './routes/whatsapp.js';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '2mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/surveys', surveysRouter);
app.use('/api/responses', responsesRouter);
app.use('/webhook/whatsapp', whatsappRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
