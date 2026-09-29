<img width="1902" height="861" alt="DEEP-SYNC screenshot" src="https://github.com/user-attachments/assets/7dd22ebb-0e7b-4d3e-8ea1-44580cf1f5be" />

# DEEP-SYNC — Neural Wellness Journal

> An AI-powered voice journaling platform. Speak your thoughts; receive mood analysis, summaries, and personalised advice — all privately stored under your own account.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://your-app.vercel.app)

---

## ✨ Features

- 🎙️ **Voice-first journaling** — powered by the ElevenLabs Conversational AI Agent
- 🧠 **AI analysis** — Gemini 2.0 Flash extracts mood, summary, and personalised advice from each session
- 🔐 **Secure & private** — Google Sign-In via Firebase Auth; each user's data is isolated in Firestore
- 📜 **Memory Log** — browse your full history of past journal entries

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express 5, Helmet, express-rate-limit |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| AI (Voice) | ElevenLabs Conversational AI Agent |
| AI (Analysis) | Google Gemini 2.0 Flash |

---

## 📂 Project Structure

```
ElevenLab_Challenge/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── config/             # Firebase client config (reads from env vars)
│       ├── hooks/              # useAuth, useConversationSession
│       ├── pages/              # AuthPage, JournalView, HistoryView
│       └── services/           # api.js — all backend API calls
└── server/                     # Node.js + Express backend
    └── src/
        ├── config/             # Firebase Admin + Gemini SDK setup
        ├── middleware/         # verifyToken auth middleware
        ├── routes/             # api.js — all Express routes
        └── services/           # geminiService, journalService
```

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with **Authentication** (Google provider) and **Firestore** enabled
- An [ElevenLabs](https://elevenlabs.io/) account with a Conversational AI Agent created
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/ElevenLab_Challenge
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in your values:

```env
PORT=3001
AGENT_ID=           # ElevenLabs → your Agent ID
XI_API_KEY=         # ElevenLabs → API Keys → your key
GEMINI_API_KEY=     # Google AI Studio → Get API Key
ALLOWED_ORIGIN=http://localhost:5173
```

You also need a Firebase service account key:
1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Save the downloaded JSON as `server/service-account.json`

> ⚠️ `service-account.json` is git-ignored — never commit it.

### 3. Set up the client

```bash
cd ../client
npm install
cp .env.local.example .env.local
```

Open `client/.env.local` and fill in your Firebase **web app** config  
(Firebase Console → Project Settings → Your apps → Web):

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 4. Run both servers

```bash
# Terminal 1 — backend
cd server && npm start

# Terminal 2 — frontend
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

