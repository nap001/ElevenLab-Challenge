# Deep-Sync: Emotional Wellness Journal

Deep-Sync is an AI-powered emotional wellness platform designed to provide a supportive, voice-first environment for journaling and reflection. Built for the **ElevenLabs Hackathon**, it leverages cutting-edge conversational AI to turn the act of journaling into a dynamic, interactive dialogue.

## 🌟 Key Features
- **Voice-First Interaction:** Uses the **ElevenLabs Conversational AI Agent** for lifelike, emotionally resonant voice input and output.
- **Intelligent Analysis:** Integrates **Google Cloud Gemini 1.5/2.5 Flash** to analyze journal entries and provide meaningful insights into emotional trends.
- **Secure Persistence:** Automatically saves journal data and analysis results to a **Firebase Firestore** database.
- **Seamless UX:** A modern, responsive React frontend coupled with a robust Node.js backend.

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS, ElevenLabs Conversational AI SDK.
- **Backend:** Node.js, Express.js.
- **AI Models:** ElevenLabs (TTS/Conversational Agent), Google Gemini (LLM Analysis).
- **Database:** Firebase Firestore.
- **Deployment:** Optimized for Vercel (Frontend) and Render (Backend).

## 📂 Project Structure
```text
ElevenLab-Challenge/
├── backend/            # Node.js server, Gemini API integration, Firestore logic
├── client/             # React frontend, ElevenLabs agent integration
└── .gitignore          # Root-level ignore for node_modules and API secrets
