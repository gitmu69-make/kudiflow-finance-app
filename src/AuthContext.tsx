import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
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
          let userDoc = await getDoc(userRef).catch(err => {
            console.warn("Offline: Using cached user profile if available", err.message);
            return null;
          });

          // If getDoc says it doesn't exist but we are online, check server once to avoid permission errors on write
          if ((!userDoc || !userDoc.exists()) && navigator.onLine) {
            try {
              userDoc = await getDocFromServer(userRef);
            } catch (e) {
              // Ignore server fetch errors, fallback to what we have
            }
          }
          
          if (userDoc && !userDoc.exists()) {
            const profile: any = {
              createdAt: serverTimestamp()
            };
            if (newUser.displayName) profile.displayName = newUser.displayName;
            
            // setDoc will be queued by Firestore if offline
            // If it fails on server due to a conflict (already exists), it will be caught here
            await setDoc(userRef, profile).catch(err => {
              // Only report if it's not a likely conflict or if we are online and it's definitely a permission issue
              if (navigator.onLine && !err.message.includes('insufficient permissions')) {
                handleFirestoreError(err, 'write', userRef.path);
              } else if (navigator.onLine) {
                // If it's a permission error while online, it might mean the document already exists 
                // and we're violating the update rule (immutability of createdAt)
                console.log("Profile likely exists on server, skipping creation.");
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
