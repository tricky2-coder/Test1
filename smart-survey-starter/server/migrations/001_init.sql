
-- PostgreSQL schema for SmartSurvey.AI

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('creator','filler')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  languages TEXT[] DEFAULT ARRAY['en'],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  text JSONB NOT NULL,              -- {en: "...", hi: "...", mr: "..."}
  qtype TEXT NOT NULL,              -- 'yesno'|'mcq'|'rating'|'short'
  options JSONB,                    -- [{value:'cbse', label:{en:'CBSE', hi:'...'}}]
  required BOOLEAN DEFAULT false,
  skip_logic JSONB,                 -- e.g. [{"if":{"qid":1,"equals":"No"},"goto":"end"}]
  meta JSONB
);

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  filler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'web',  -- 'web'|'whatsapp'
  language TEXT DEFAULT 'en',
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES responses(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
