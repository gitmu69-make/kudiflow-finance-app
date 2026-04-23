import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { signIn, auth, signInAsGuest } from './firebase';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { BarChart3, Plus, LogOut, ArrowLeft, Smartphone, ShieldCheck, WifiOff, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { user, loading, isOnline } = useAuth();
  const [view, setView] = useState<'dashboard' | 'add'>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setAuthError("Popup was blocked by your browser. Please allow popups for this site or try logging in again.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Login window was closed before finishing. Please try again.");
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
      } else {
        setAuthError(err.message || "Guest log-in failed.");
      }
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
      <div className="min-h-screen bg-[#1A1816] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F9F7F2] p-8 rounded-[3rem] mb-10 shadow-2xl"
        >
          <BarChart3 className="w-16 h-16 text-[#1A1816]" />
        </motion.div>
        <h1 className="text-5xl font-bold mb-4 tracking-tight font-display text-[#F9F7F2]">KudiFlow</h1>
        <p className="text-lg text-[#D1CDC3] mb-12 max-w-xs font-display">
          Empowering small businesses with clarity. Track your daily flow and watch your profit grow.
        </p>
        
        <div className="w-full max-w-sm space-y-6">
          <button 
            onClick={handleGoogleSignIn}
            className="btn-primary w-full flex items-center justify-center gap-4 py-5 text-xl font-bold"
          >
            <Smartphone className="w-6 h-6" />
            Get Started
          </button>
          
          <div className="w-full space-y-3">
            <button 
              onClick={handleGuestSignIn}
              className="btn-secondary w-full flex items-center justify-center gap-4 py-5 text-xl font-bold border-none"
            >
              <UserCircle className="w-6 h-6" />
              Continue as Guest
            </button>
            <p className="text-xs text-[#A89F91] font-display">
              Try KudiFlow instantly without an account. Your data stays on this device.
            </p>
          </div>

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
        
        <div className="flex items-center gap-3">
          {user?.isAnonymous && (
            <div className="bg-[#3D3935] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#D1CDC3] border border-[#4A453F]">
              Guest Mode
            </div>
          )}
          {!isOnline && (
            <div className="bg-amber-50 p-2 rounded-xl" title="Offline mode">
              <WifiOff className="w-5 h-5 text-amber-600" />
            </div>
          )}
          <button 
            onClick={() => auth.signOut()}
            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
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
