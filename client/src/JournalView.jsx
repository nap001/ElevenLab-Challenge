import React from 'react';
import { motion } from 'framer-motion';

export default function JournalView({ 
  connectionStatus, 
  isSpeaking, 
  onStartCall, 
  onEndCall, 
  onViewHistory 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Right Link */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={onViewHistory} 
          className="text-xs font-bold tracking-widest text-slate-500 hover:text-white uppercase transition-colors flex items-center gap-2"
        >
          History <span className="text-lg">→</span>
        </button>
      </div>

      {/* Main UI */}
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-4xl font-extralight tracking-[0.3em] text-white mb-2">
          DEEP-SYNC
        </h1>
        <p className="text-slate-500 text-sm tracking-widest mb-16 uppercase">
          Neural Wellness Interface
        </p>

        {/* VISUALIZER ORB */}
        <div className="relative w-80 h-80 flex items-center justify-center mb-16">
          {/* Ripple Effect when speaking */}
          {isSpeaking && (
            <>
              <motion.div 
                className="absolute border border-blue-500/30 rounded-full"
                animate={{ width: ['0%', '100%'], opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                style={{ height: '100%' }}
              />
              <motion.div 
                className="absolute border border-blue-400/20 rounded-full"
                animate={{ width: ['0%', '100%'], opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                style={{ height: '100%' }}
              />
            </>
          )}
          
          {/* Core Circle */}
          <motion.div 
            animate={{ scale: isSpeaking ? 1.05 : 1 }}
            className={`w-40 h-40 rounded-full flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 border border-white/10 backdrop-blur-md
            ${connectionStatus === 'connected' 
              ? 'bg-gradient-to-b from-blue-600 to-indigo-900 shadow-blue-500/20' 
              : 'bg-slate-800'
            }`}
          >
            {connectionStatus === 'connected' ? '🎙️' : '🧠'}
          </motion.div>
        </div>

        {/* Action Button */}
      <button
        onClick={connectionStatus === 'connected' ? onEndCall : onStartCall}
        className={`px-10 py-4 rounded-full font-medium text-lg transition-all ${
          connectionStatus === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {connectionStatus === 'connected' ? 'End Session' : 'Start Check-in'}
      </button>

        {/* Status Text */}
        <p className="mt-8 text-xs font-mono text-slate-500 uppercase">
          Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-slate-400'}>{connectionStatus}</span>
        </p>
      </div>
    </div>
  );
}