import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDocFromCache, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isOnline: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Test connection and ensure user profile exists
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDocFromCache(userRef).catch(() => null);
          
          if (!userDoc || !userDoc.exists()) {
            await setDoc(userRef, {
              displayName: user.displayName,
              createdAt: serverTimestamp()
            }, { merge: true }).catch(err => handleFirestoreError(err, 'create', `users/${user.uid}`));
          }
          
          // CRITICAL: Test connection to Firestore
          await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
             // Ignore test connection failure if purely because collection doesn't exist, 
             // but handle if unauthorized or offline
          });
          
        } catch (error) {
          console.error("Firebase connection test failed", error);
        }
      }
      setUser(user);
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
