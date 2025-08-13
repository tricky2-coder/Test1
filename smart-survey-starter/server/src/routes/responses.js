
import { Router } from 'express';
import { pool } from '../pg.js';

const r = Router();

// Create a new response session
r.post('/:surveyId/start', async (req, res) => {
  const { surveyId } = req.params;
  const { filler_id=null, language='en', channel='web' } = req.body || {};
  const { rows } = await pool.query(
    'INSERT INTO responses (survey_id, filler_id, language, channel) VALUES ($1,$2,$3,$4) RETURNING *',
    [surveyId, filler_id, language, channel]
  );
  res.json(rows[0]);
});

// Save an answer
r.post('/:responseId/answer', async (req, res) => {
  const { responseId } = req.params;
  const { question_id, answer_text, media_url } = req.body;
  await pool.query(
    'INSERT INTO answers (response_id, question_id, answer_text, media_url) VALUES ($1,$2,$3,$4)',
    [responseId, question_id, answer_text, media_url || null]
  );
  res.json({ ok: true });
});

// Submit (finish) response
r.post('/:responseId/submit', async (req, res) => {
  const { responseId } = req.params;
  await pool.query('UPDATE responses SET submitted_at=now() WHERE id=$1', [responseId]);
  res.json({ ok: true });
});

// Basic dashboard aggregates
r.get('/survey/:surveyId/summary', async (req, res) => {
  const { surveyId } = req.params;
  const totalResponses = await pool.query('SELECT count(*) FROM responses WHERE survey_id=$1 AND submitted_at IS NOT NULL', [surveyId]);
  const latest = await pool.query('SELECT id, submitted_at FROM responses WHERE survey_id=$1 ORDER BY submitted_at DESC LIMIT 5', [surveyId]);
  res.json({ total: int(totalResponses.rows[0].count), latest: latest.rows });
});

function int(x){ return parseInt(x,10)||0; }

export default r;
