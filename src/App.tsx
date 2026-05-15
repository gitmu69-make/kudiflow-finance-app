import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { signIn, auth, signInAsGuest, logout, signInWithEmail, signUpWithEmail } from './firebase';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { BarChart3, Plus, LogOut, ArrowLeft, Smartphone, ShieldCheck, WifiOff, UserCircle, Download, Mail, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const AppContent: React.FC = () => {
  const { user, loading, isOnline } = useAuth();
  const [view, setView] = useState<'dashboard' | 'add'>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // Email Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'select'>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setAuthError("Popup was blocked by your browser. Please allow popups for this site or try logging in again.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Login window was closed before finishing. Please try again.");
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(`Domain "${currentDomain}" is not authorized. Please go to your Firebase Console (Authentication > Settings > Authorized domains) and add "${currentDomain}" to the list.`);
      } else {
        setAuthError(err.message || "Google login failed.");
      }
    }
  };

  const handleGuestSignIn = async () => {
    setAuthError(null);
    try {
      await signInAsGuest();
    } catch (err: any) {
      if (err.code === 'auth/admin-restricted-operation') {
        setAuthError("Anonymous sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(`Domain "${currentDomain}" is not authorized. Please add it to your Firebase Authorized Domains.`);
      } else {
        setAuthError(err.message || "Guest log-in failed.");
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Try logging in.");
      } else if (err.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError(err.message || "Authentication failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="bg-neutral-900 p-4 rounded-3xl"
        >
          <BarChart3 className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1A1816] flex flex-col items-center justify-center p-6 sm:p-8 text-center overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F9F7F2] p-6 rounded-[2.5rem] mb-8 shadow-2xl relative"
        >
          <BarChart3 className="w-12 h-12 text-[#1A1816]" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-3 tracking-tight font-display text-[#F9F7F2]">KudiFlow</h1>
        <p className="text-base text-[#D1CDC3] mb-8 max-w-xs font-display">
          Empowering small businesses with clarity. Track your daily flow and watch your profit grow.
        </p>
        
        <div className="w-full max-w-sm space-y-5">
          {installPrompt && authMode === 'select' && (
            <button 
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-4 py-4 px-6 rounded-[2rem] bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
            >
              <Download className="w-6 h-6" />
              Install KudiFlow App
            </button>
          )}

          <AnimatePresence mode="wait">
            {authMode === 'select' ? (
              <motion.div 
                key="select"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <button 
                  onClick={() => setAuthMode('login')}
                  className="btn-primary w-full flex items-center justify-center gap-4 py-4 text-lg font-bold"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email
                </button>

                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-4 py-4 text-lg font-bold bg-white text-black hover:bg-neutral-100 transition-colors rounded-[2rem]"
                >
                  <Smartphone className="w-5 h-5" />
                  Sign in with Google
                </button>
                
                <div className="w-full space-y-3 pt-2">
                  <button 
                    onClick={handleGuestSignIn}
                    className="btn-secondary w-full flex items-center justify-center gap-4 py-4 text-lg font-bold border-none"
                  >
                    <UserCircle className="w-5 h-5" />
                    Continue as Guest
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[#25221F] p-6 rounded-[2.5rem] border border-[#3D3935] shadow-2xl text-left"
              >
                <div className="flex items-center gap-3 mb-6">
                  <button 
                    onClick={() => { setAuthMode('select'); setAuthError(null); }}
                    className="p-2 hover:bg-[#3D3935] rounded-xl transition-colors text-[#A89F91]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-[#F9F7F2] font-display">
                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#6B6359] uppercase ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6359]" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-[#1A1816] text-[#F9F7F2] pl-11 pr-4 py-3 rounded-2xl border border-[#3D3935] outline-none focus:border-indigo-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#6B6359] uppercase ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6359]" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1A1816] text-[#F9F7F2] pl-11 pr-4 py-3 rounded-2xl border border-[#3D3935] outline-none focus:border-indigo-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-4 mt-4 font-bold flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      authMode === 'login' ? 'Sign In' : 'Sign Up'
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button 
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-xs text-indigo-400 font-medium hover:text-indigo-300"
                    >
                      {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-900/20 border border-red-900/30 p-4 rounded-2xl text-xs text-red-400 leading-relaxed"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-8 text-[#6B6359] text-sm font-display">
            Developed by advmlabs
          </footer>

          <div className="flex items-center justify-center gap-2 text-sm text-[#A89F91]">
            <ShieldCheck className="w-4 h-4" />
            Secure Authentication
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1816] pb-32">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#1A1816]/80 backdrop-blur-lg z-10 border-b border-[#3D3935]">
        <div className="flex items-center gap-3">
          {view === 'add' ? (
            <button 
              onClick={() => setView('dashboard')}
              className="p-3 hover:bg-[#3D3935] rounded-2xl transition-colors text-[#F9F7F2]"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
             <div className="bg-[#F9F7F2] p-2.5 rounded-2xl">
               <BarChart3 className="w-6 h-6 text-[#1A1816]" />
             </div>
          )}
          <h1 className="font-bold text-2xl font-display text-[#F9F7F2]">{view === 'dashboard' ? 'KudiFlow' : 'Record Transaction'}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {installPrompt && (
            <button 
              onClick={handleInstall}
              className="hidden sm:flex items-center gap-2 bg-[#F9F7F2] text-[#1A1816] px-3 py-2 rounded-xl text-xs font-bold font-display hover:scale-105 transition-transform"
            >
              <Download className="w-4 h-4" />
              INSTALL APP
            </button>
          )}

          {!isOnline && (
            <div className="bg-amber-900/20 p-2 rounded-xl" title="Offline mode">
              <WifiOff className="w-5 h-5 text-amber-500" />
            </div>
          )}
          
          <div className="flex items-center gap-2 pl-3 border-l border-[#3D3935]">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-[#F9F7F2] font-display uppercase leading-none">
                {user?.isAnonymous ? 'Guest User' : (user?.displayName?.split(' ')[0] || 'User')}
              </p>
              <button 
                onClick={() => logout()}
                className="text-[8px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400"
              >
                Sign Out
              </button>
            </div>
            <div className="relative group">
              <button 
                onClick={() => logout()}
                className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#3D3935] hover:border-red-500/50 transition-all shadow-lg active:scale-95"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-[#3D3935] flex items-center justify-center text-[#F9F7F2] font-bold font-display">
                    {user?.displayName?.[0] || user?.email?.[0] || '?'}
                  </div>
                )}
              </button>
              {user?.isAnonymous && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-[#1A1816]" title="Guest session" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Dashboard />
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TransactionForm onSuccess={() => setView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#25221F]/80 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border border-[#3D3935] z-50">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
            view === 'dashboard' ? 'bg-[#F9F7F2] text-[#1A1816] shadow-lg' : 'text-[#6B6359]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className={view === 'dashboard' ? 'block' : 'hidden'}>Dashboard</span>
        </button>
        <button 
          onClick={() => setView('add')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
            view === 'add' ? 'bg-[#F9F7F2] text-[#1A1816] shadow-lg' : 'text-[#6B6359]'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className={view === 'add' ? 'block' : 'hidden'}>Log Flow</span>
        </button>
      </nav>

      {/* App Footer */}
      <footer className="mt-12 mb-24 text-center">
        <p className="text-[#6B6359] text-xs font-display">developed by advmlabs</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
