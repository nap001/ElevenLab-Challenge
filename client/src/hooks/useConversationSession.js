/**
 * useConversationSession — wraps ElevenLabs useConversation to manage the
 * voice-call lifecycle and accumulate the transcript.
 *
 * @param {import('firebase/auth').User} user - Authenticated Firebase user.
 * @returns {{
 *   connectionStatus: 'ready' | 'connecting' | 'connected',
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
  const [connectionStatus, setConnectionStatus] = useState('ready');
  const [transcript, setTranscript] = useState('');

  const conversation = useConversation({
    onConnect: () => {
      setConnectionStatus('connected');
      setTranscript('');
    },
    onDisconnect: () => setConnectionStatus('ready'),
    onMessage: (message) => {
      const text = message.message || message.text;
      if (text) setTranscript((prev) => `${prev}\n${text}`);
    },
    onError: (err) => {
      console.error('[ElevenLabs]', err);
      setConnectionStatus('ready');
    },
  });

  const startCall = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const signedUrl = await fetchSignedUrl(user);
      await conversation.startSession({ signedUrl });
    } catch (err) {
      console.error('[startCall] Failed:', err.message);
      setConnectionStatus('ready');
    }
  }, [user, conversation]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    setConnectionStatus('ready');
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
