/**
 * useConversationSession — wraps ElevenLabs useConversation to manage the
 * voice-call lifecycle and accumulate the transcript.
 *
 * @param {import('firebase/auth').User} user - Authenticated Firebase user.
 * @returns {{
 *   connectionStatus: 'connected' | 'disconnected',
 *   isSpeaking: boolean,
 *   transcript: string,
 *   startCall: () => Promise<void>,
 *   endCall: () => Promise<object | null>,
 * }}
 */
import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { fetchSignedUrl, analyzeJournal } from '../services/api';

const MIN_TRANSCRIPT_LENGTH = 5;

export function useConversationSession(user) {
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
      if (text) setTranscript((prev) => `${prev}\n${text}`);
    },
    onError: (err) => console.error('[ElevenLabs]', err),
  });

  const startCall = useCallback(async () => {
    try {
      const signedUrl = await fetchSignedUrl(user);
      await conversation.startSession({ signedUrl });
    } catch (err) {
      console.error('[startCall] Failed:', err.message);
    }
  }, [user, conversation]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    if (transcript.trim().length > MIN_TRANSCRIPT_LENGTH) {
      try {
        const result = await analyzeJournal(user, transcript);
        return result;
      } catch (err) {
        console.error('[endCall] Analysis failed:', err.message);
      }
    }
    return null;
  }, [user, conversation, transcript]);

  return {
    connectionStatus,
    isSpeaking: conversation.isSpeaking,
    transcript,
    startCall,
    endCall,
  };
}
