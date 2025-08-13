
# SmartSurvey.AI – Hackathon MVP

This is a working scaffold for the Smart Survey Tool with:
- PostgreSQL schema (SQL)
- Node.js/Express backend
- AI endpoints (stubs with OpenAI-compatible calls)
- Survey creator + filler + dashboard minimal UIs
- WhatsApp webhook endpoint (Twilio/Meta style) with skip-logic flow

## Quick Start

### 1) Requirements
- Node 18+
- PostgreSQL 14+

### 2) Create DB & run migration
```bash
createdb smart_survey
psql smart_survey -f server/migrations/001_init.sql
```

### 3) Configure environment
Copy `.env.example` to `.env` and set your secrets:
```
cp server/.env.example server/.env
```

### 4) Install & run
```bash
cd server
npm install
npm run dev
```
App runs at http://localhost:3000

### 5) WhatsApp Bot (Demo)
- Set your webhook URL (ngrok suggested) to `POST /webhook/whatsapp`
- For Twilio: configure a WhatsApp sandbox, set webhook to your public URL.
- For Meta Cloud API: set webhook to the same endpoint and map fields as needed.

## Notes
- AI calls are stubbed to work without keys. Add keys to enable real AI generation & translation.
- Skip logic stored per-question in JSON.
