
import { Router } from 'express';
import { pool } from '../pg.js';

const r = Router();

// This endpoint is compatible with Twilio or Meta with minor mapping.
// Expects body with { from, body } or similar.
r.post('/', async (req, res) => {
  const payload = req.body;
  const text = payload?.Body || payload?.message?.text || payload?.body || '';
  const from = payload?.From || payload?.from || 'demo-user';

  // Very simple session management: one active survey hardcoded or by keyword
  // In production, map the user 'from' to an active response in DB.
  // Demo: assume survey 1 exists and we iterate questions in order.

  const { rows: qrows } = await pool.query('SELECT * FROM questions WHERE survey_id=$1 ORDER BY order_index', [1]);
  if (qrows.length === 0) return res.json({ reply: 'No survey found.' });

  // Find or start response
  const respExisting = await pool.query(
    "SELECT * FROM responses WHERE survey_id=$1 AND channel='whatsapp' AND submitted_at IS NULL AND filler_id IS NULL ORDER BY started_at DESC LIMIT 1",
    [1]
  );
  let response = respExisting.rows[0];
  if (!response) {
    const ins = await pool.query("INSERT INTO responses (survey_id, channel, language) VALUES ($1,'whatsapp','en') RETURNING *", [1]);
    response = ins.rows[0];
    // Send first question
    return res.json({ reply: renderQuestion(qrows[0]) });
  }

  // Determine how many answers given
  const ans = await pool.query('SELECT count(*) FROM answers WHERE response_id=$1', [response.id]);
  let idx = parseInt(ans.rows[0].count, 10);
  // Save last answer if not the first interaction
  if (idx > 0 || text.toLowerCase() !== 'start') {
    const qPrev = qrows[idx-1];
    if (qPrev) {
      await pool.query('INSERT INTO answers (response_id, question_id, answer_text) VALUES ($1,$2,$3)',
        [response.id, qPrev.id, text]);
    }
  }

  // Move to next question (very basic, no skip-logic here for brevity)
  const qNext = qrows[idx];
  if (qNext) {
    return res.json({ reply: renderQuestion(qNext) });
  } else {
    await pool.query('UPDATE responses SET submitted_at=now() WHERE id=$1', [response.id]);
    return res.json({ reply: 'Thank you! Your survey is complete.' });
  }
});

function renderQuestion(q){
  let line = q.text?.en || 'Question';
  if (q.qtype === 'mcq' && Array.isArray(q.options)){
    line += '\nOptions: ' + q.options.map(o => o.label?.en || o.value).join(', ');
  }
  return line;
}

export default r;
