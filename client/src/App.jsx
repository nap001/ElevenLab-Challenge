import React, { useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import axios from 'axios';
import JournalView from './JournalView';
import HistoryView from './HistoryView';
import { API_BASE_URL } from './config';

export default function App() {
  const [view, setView] = useState('journal'); 
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState(''); 

  const conversation = useConversation({
    onConnect: () => {
      setConnectionStatus('connected');
      setTranscript(''); 
    },
    onDisconnect: () => setConnectionStatus('disconnected'),
    onMessage: (message) => {
      const text = message.message || message.text; 
      if (text) setTranscript(prev => prev + "\n" + text);
    },
    onError: (e) => console.error(e),
  });

  const startCall = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/get-signed-url`);
      await conversation.startSession({ signedUrl: data.signedUrl });
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  const endCall = async () => {
    await conversation.endSession();
    
    // Simple logic to prevent saving empty calls
    if (transcript.length > 5) {
      console.log("Analyzing session...");
      // Show a toast or notification here if you want
      await axios.post(`${API_BASE_URL}/api/analyze-journal`, { transcript });
      alert("Entry saved to Neural Log.");
    }
  };

  return (
    <>
      {view === 'journal' ? (
        <JournalView 
          connectionStatus={connectionStatus}
          isSpeaking={conversation.isSpeaking}
          onStartCall={startCall}
          onEndCall={endCall}
          onViewHistory={() => setView('history')}
        />
      ) : (
        <HistoryView 
          onBack={() => setView('journal')} 
        />
      )}
    </>
  );
}