require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); // Import File System module

// --- TRICK: Recreate Key File in Production ---
// On Render, we can't upload files easily, so we paste the JSON content 
// into an Environment Variable named "GOOGLE_CREDENTIALS_JSON".
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  console.log("Creating temporary service-account.json file...");
  fs.writeFileSync('./service-account.json', process.env.GOOGLE_CREDENTIALS_JSON);
}

// 1. Firebase Admin Setup
const admin = require('firebase-admin');
// Now this file definitely exists, either locally or created above
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. Vertex AI Setup
const { VertexAI } = require('@google-cloud/vertexai');
const vertexAI = new VertexAI({ 
    project: process.env.GOOGLE_CLOUD_PROJECT_ID, 
    location: 'us-central1' 
});
const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const app = express();
app.use(cors()); // Allow all connections (easiest for hackathons)
app.use(express.json());

app.get('/api/get-signed-url', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.AGENT_ID}`,
      { headers: { 'xi-api-key': process.env.XI_API_KEY } }
    );
    res.json({ signedUrl: response.data.signed_url });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.post('/api/analyze-journal', async (req, res) => {
  const { transcript } = req.body;
  try {
    const prompt = `Analyze this journal: "${transcript}". Return JSON with mood, summary, advice.`;
    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());

    const entry = {
      timestamp: new Date().toISOString(),
      transcript,
      ...analysis
    };
    await db.collection('journal_entries').add(entry);
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Analysis failed:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const snapshot = await db.collection('journal_entries').orderBy('timestamp', 'desc').get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Use the PORT variable provided by the hosting service
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));