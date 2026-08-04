import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern multi-tab persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

// CRITICAL: Connection test
async function testConnection() {
  if (!navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && !error.message.includes('the client is offline')) {
      console.warn("Firestore connection check failed:", error.message);
    }
  }
}
testConnection();

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  const currentAuth = getAuth();
  if (!currentAuth) throw new Error("Firebase Auth not found");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(currentAuth, provider);
};

export const signInAsGuest = async () => {
  const currentAuth = getAuth();
  if (!currentAuth) throw new Error("Firebase Auth not found");
  return signInAnonymously(currentAuth);
};

export const signUpWithEmail = async (email: string, pass: string) => {
  const currentAuth = getAuth();
  if (!currentAuth) throw new Error("Firebase Auth not found");
  return createUserWithEmailAndPassword(currentAuth, email, pass);
};

export const signInWithEmail = async (email: string, pass: string) => {
  const currentAuth = getAuth();
  if (!currentAuth) throw new Error("Firebase Auth not found");
  return signInWithEmailAndPassword(currentAuth, email, pass);
};

export const logout = async () => {
  const currentAuth = getAuth();
  if (currentAuth) {
    return signOut(currentAuth);
  }
};

export interface Transaction {
  id?: string;
  userId: string;
  type: 'sale' | 'expense';
  amount: number;
  category?: string;
  note?: string;
  timestamp: any; // Firestore Timestamp
}

export interface UserProfile {
  displayName?: string;
  createdAt: any;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData
  } : {
    userId: '',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error.message || String(error),
    operationType,
    path,
    authInfo
  };

  throw new Error(JSON.stringify(errorInfo));
}
