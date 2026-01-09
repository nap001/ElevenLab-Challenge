import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from './config';
export default function HistoryView({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/history`)
      .then(res => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-10 mt-4">
        <button 
          onClick={onBack} 
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>
        <h2 className="text-xl font-light tracking-widest text-blue-200 uppercase">
          Memory Log
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-slate-500 animate-pulse mt-20">Syncing with database...</div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="text-center mt-20 opacity-50">
          <div className="text-6xl mb-4">🌑</div>
          <p>No entries yet. Start a session to begin.</p>
        </div>
      )}

      {/* List */}
      <div className="w-full max-w-2xl space-y-4">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group"
          >
            {/* Top Row: Date & Mood */}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono text-slate-400">
                {new Date(log.timestamp).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider
                ${log.mood === 'Happy' || log.mood === 'Calm' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  log.mood === 'Anxious' || log.mood === 'Stressed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                {log.mood}
              </span>
            </div>

            {/* Content */}
            <p className="text-slate-200 leading-relaxed mb-4 font-light">
              {log.summary}
            </p>

            {/* AI Advice Footer */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex gap-3 items-start">
              <span className="text-lg">💡</span>
              <p className="text-sm text-blue-200/80 italic leading-snug pt-1">
                "{log.advice}"
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}