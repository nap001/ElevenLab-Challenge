/**
 * AuthPage — full-screen sign-in page.
 * Uses Google OAuth via Firebase popup flow.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in useAuth hook handles navigation
    } catch (err) {
      console.error('[AuthPage] Sign-in failed:', err.message);
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans relative overflow-hidden">

      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      {/* Animated ring decorations */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full border border-purple-500/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="z-10 flex flex-col items-center bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl px-10 py-12 w-[380px] shadow-2xl"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-500/30 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(59,130,246,0.25)] mb-6"
        >
          🧠
        </motion.div>

        <h1 className="text-3xl font-extralight tracking-[0.3em] text-white mb-1">
          DEEP-SYNC
        </h1>
        <p className="text-slate-500 text-xs tracking-widest uppercase mb-8">
          Neural Wellness Interface
        </p>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-8" />

        <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
          Sign in to access your personal<br />wellness journal and neural history.
        </p>

        {/* Google Sign-In Button */}
        <motion.button
          id="google-signin-btn"
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <motion.div
              className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
          )}
          {loading ? 'Connecting...' : 'Continue with Google'}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
            className="mt-4 text-red-400 text-xs text-center"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-8 text-slate-600 text-xs text-center">
          Your data is private and encrypted.<br />Only you can access your journal.
        </p>
      </motion.div>
    </div>
  );
}
