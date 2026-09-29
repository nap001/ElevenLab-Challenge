/**
 * useAuth — subscribes to Firebase auth state and exposes the current user.
 *
 * Returns:
 *  - user: FirebaseUser | null | undefined
 *    - undefined: auth state is still loading
 *    - null:      user is signed out
 *    - object:    authenticated user
 *  - isLoading: boolean shorthand
 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  return { user, isLoading: user === undefined };
}
