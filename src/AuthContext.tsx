import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Preferences } from '@capacitor/preferences';
import { auth, db, handleFirestoreError } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isOnline: true });

export const useAuth = () => useContext(AuthContext);

const PREF_USER_KEY = 'kudiflow_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for cached user ID to reduce flickering when offline
    const checkCachedUser = async () => {
      const { value } = await Preferences.get({ key: PREF_USER_KEY });
      if (value && !user) {
        // We don't have the full user object yet, but we know they were logged in
        // This helps the UI decide whether to show the login screen or a loading state
      }
    };
    checkCachedUser();
    
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      if (newUser) {
        await Preferences.set({ key: PREF_USER_KEY, value: newUser.uid });
        try {
          const userRef = doc(db, 'users', newUser.uid);
          // Use getDoc which works with offline cache
          const userDoc = await getDoc(userRef).catch(err => {
            console.warn("Offline: Using cached user profile if available", err.message);
            return null;
          });
          
          if (userDoc && !userDoc.exists()) {
            const profile: any = {
              createdAt: serverTimestamp()
            };
            if (newUser.displayName) profile.displayName = newUser.displayName;
            
            // setDoc will be queued by Firestore if offline
            await setDoc(userRef, profile).catch(err => {
              if (navigator.onLine) {
                handleFirestoreError(err, 'write', userRef.path);
              }
            });
          }
        } catch (error) {
          console.error("Auth sync error:", error);
        }
      } else {
        await Preferences.remove({ key: PREF_USER_KEY });
      }
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
};
