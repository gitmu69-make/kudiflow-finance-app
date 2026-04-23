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
        try {
          const userRef = doc(db, 'users', user.uid);
          // Only attempt to create profile if we don't have it in cache
          const userDoc = await getDocFromCache(userRef).catch(() => null);
          
          if (!userDoc || !userDoc.exists()) {
            const profile: any = {
              createdAt: serverTimestamp()
            };
            if (user.displayName) profile.displayName = user.displayName;
            
            await setDoc(userRef, profile, { merge: true }).catch(err => {
              // Ignore failure for guest users if they already exist or if rules block initial creation
              console.warn("Could not create/update user profile:", err.message);
            });
          }
        } catch (error) {
          console.error("Auth sync error:", error);
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
