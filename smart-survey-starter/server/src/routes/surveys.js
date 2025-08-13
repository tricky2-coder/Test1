
import { Router } from 'express';
import { pool } from '../pg.js';
import { generateSurveyFromPrompt, translateSurvey } from '../ai.js';

const r = Router();

// Create survey via AI
r.post('/generate', async (req, res) => {
  const { prompt, creator_id = 1 } = req.body;
  const draft = await generateSurveyFromPrompt(prompt || 'schools in Mumbai');
  const { rows } = await pool.query(
    'INSERT INTO surveys (creator_id, title, description, languages) VALUES ($1,$2,$3,$4) RETURNING *',
    [creator_id, draft.title, 'AI-generated survey', ['en']]
  );
  const survey = rows[0];
  // insert questions
  let order = 1;
  for (const q of draft.questions) {
    await pool.query(
      'INSERT INTO questions (survey_id, order_index, text, qtype, options, required, skip_logic) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [survey.id, order++, q.text || {en:'Question'}, q.qtype || 'short', q.options || null, q.required || false, q.skip_logic || null]
    );
  }
  res.json({ survey_id: survey.id, title: survey.title });
});

// Translate survey
r.post('/:id/translate', async (req, res) => {
  const { id } = req.params;
  const { targetLang='hi' } = req.body;
  const { rows: qrows } = await pool.query('SELECT * FROM questions WHERE survey_id=$1 ORDER BY order_index', [id]);
  const survey = { questions: qrows.map(q => ({ qtype:q.qtype, text:q.text, options:q.options })) };
  const translated = await translateSurvey(survey, targetLang);
  // persist translations
  for (let i=0;i<qrows.length;i++) {
    const original = qrows[i];
    const t = translated.questions[i];
    await pool.query('UPDATE questions SET text=$1, options=$2 WHERE id=$3',
      [t.text, t.options, original.id]);
  }
  // add language to survey
  await pool.query("UPDATE surveys SET languages = array(SELECT DISTINCT unnest(languages || $1::text[])) WHERE id=$2",
    [[targetLang], id]);
  res.json({ ok: true, language: targetLang });
});

// Get a survey with questions
r.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { rows: srows } = await pool.query('SELECT * FROM surveys WHERE id=$1', [id]);
  const { rows: qrows } = await pool.query('SELECT * FROM questions WHERE survey_id=$1 ORDER BY order_index', [id]);
  res.json({ survey: srows[0], questions: qrows });
});

export default r;
