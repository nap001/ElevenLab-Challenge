/**
 * App — root component.
 *
 * Responsibilities:
 *  - Resolve auth state via useAuth
 *  - Manage top-level view routing (journal ↔ history)
 *  - Coordinate sign-out
 *
 * Business logic (API calls, conversation management) lives in hooks/services.
 */
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import { useAuth } from './hooks/useAuth';
import { useConversationSession } from './hooks/useConversationSession';
import AuthPage from './pages/AuthPage';
import JournalView from './pages/JournalView';
import HistoryView from './pages/HistoryView';

export default function App() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState('journal');

  const { connectionStatus, isSpeaking, startCall, endCall } = useConversationSession(user);

  const handleEndCall = async () => {
    const result = await endCall();
    if (result) {
      alert('Entry saved to Neural Log.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setView('journal');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!user) {
    return <AuthPage />;
  }

  // ── Authenticated ────────────────────────────────────────────────────────
  return (
    <>
      {view === 'journal' ? (
        <JournalView
          connectionStatus={connectionStatus}
          isSpeaking={isSpeaking}
          onStartCall={startCall}
          onEndCall={handleEndCall}
          onViewHistory={() => setView('history')}
          user={user}
          onSignOut={handleSignOut}
        />
      ) : (
        <HistoryView
          user={user}
          onBack={() => setView('journal')}
        />
      )}
    </>
  );
}