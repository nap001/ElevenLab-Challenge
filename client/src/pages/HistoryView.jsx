/**
 * HistoryView — displays a user's past journal entries.
 * Fetches data on mount using the authenticated user object.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchHistory } from '../services/api';

/** Maps a mood string to a Tailwind badge class set. */
function moodBadgeClass(mood) {
  const positive = ['Happy', 'Calm', 'Content', 'Joyful'];
  const negative = ['Anxious', 'Stressed', 'Sad', 'Angry'];

  if (positive.includes(mood)) {
    return 'bg-green-500/10 text-green-400 border border-green-500/20';
  }
  if (negative.includes(mood)) {
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }
  return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
}

/** Formats an ISO timestamp into a human-readable date/time string. */
function formatTimestamp(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryView({ user, onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchHistory(user);
        if (!cancelled) setLogs(data);
      } catch (err) {
        console.error('[HistoryView] Fetch failed:', err.message);
        if (!cancelled) setFetchError('Failed to load history. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white p-6 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-10 mt-4">
        <button
          id="back-btn"
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform" aria-hidden="true">←</span>
          Back
        </button>
        <h2 className="text-xl font-light tracking-widest text-blue-200 uppercase">
          Memory Log
        </h2>
        <div className="w-10" aria-hidden="true" /> {/* Spacer for flex centering */}
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-slate-500 animate-pulse mt-20">Syncing with database...</p>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <p role="alert" className="text-red-400 mt-20 text-center">{fetchError}</p>
      )}

      {/* Empty state */}
      {!loading && !fetchError && logs.length === 0 && (
        <div className="text-center mt-20 opacity-50">
          <div className="text-6xl mb-4" aria-hidden="true">🌑</div>
          <p>No entries yet. Start a session to begin.</p>
        </div>
      )}

      {/* Entry list */}
      <div className="w-full max-w-2xl space-y-4">
        {logs.map((log, index) => (
          <motion.article
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors"
          >
            {/* Date & mood badge */}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono text-slate-400">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${moodBadgeClass(log.mood)}`}>
                {log.mood}
              </span>
            </div>

            {/* Summary */}
            <p className="text-slate-200 leading-relaxed mb-4 font-light">
              {log.summary}
            </p>

            {/* AI advice */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex gap-3 items-start">
              <span className="text-lg" aria-hidden="true">💡</span>
              <p className="text-sm text-blue-200/80 italic leading-snug pt-1">
                &ldquo;{log.advice}&rdquo;
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
