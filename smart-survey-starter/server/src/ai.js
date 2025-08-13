
import fetch from 'node-fetch';

export async function generateSurveyFromPrompt(prompt) {
  // Stub: basic deterministic questions if no API key
  if (!process.env.OPENAI_API_KEY) {
    return {
      title: `Survey on ${prompt}`,
      language: 'en',
      questions: [
        { qtype: 'yesno', text: {en: 'Do you have children in school?'}, required: true, skip_logic: [{if:{equals:'No', qid:'Q1'}, goto:'end'}] },
        { qtype: 'mcq', text: {en: 'Which board do you prefer?'}, options: [{value:'cbse', label:{en:'CBSE'}},{value:'icse', label:{en:'ICSE'}},{value:'state', label:{en:'State Board'}}], required: true },
        { qtype: 'rating', text: {en: 'Rate school infrastructure in your area (1-5)'}, required: true },
        { qtype: 'short', text: {en: 'What is your biggest concern regarding schools?'}, required: false }
      ]
    };
  }
  // If API key exists, call OpenAI for richer generation
  const messages = [
    { role: 'system', content: 'You create concise, structured surveys as JSON.' },
    { role: 'user', content: `Generate a 8-question survey about: ${prompt}. Include yes/no, multiple choice with 3-5 options, rating 1-5, and short answer. Provide skip logic suggestions. Return JSON with {title, questions:[{qtype, text.en, options?, required, skip_logic?}]}` }
  ];
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.5 })
  });
  const data = await resp.json();
  try {
    const json = JSON.parse(data.choices[0].message.content);
    return json;
  } catch (e) {
    return { title: `Survey on ${prompt}`, questions: [] };
  }
}

export async function translateSurvey(survey, targetLang='hi') {
  // Simple clone with pseudo-translation if no key
  const clone = structuredClone(survey);
  clone.language = targetLang;
  clone.questions = (clone.questions || []).map(q => ({
    ...q,
    text: { ...(q.text||{}), [targetLang]: `[${targetLang}] ` + (q.text?.en || '') },
    options: q.options?.map(o => ({...o, label: {...(o.label||{}), [targetLang]: `[${targetLang}] ` + (o.label?.en||o.value)}}))
  }));
  return clone;
}
