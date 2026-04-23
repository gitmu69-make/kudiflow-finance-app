import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp, limit } from 'firebase/firestore';
import { db, Transaction } from '../firebase';
import { useAuth } from '../AuthContext';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart3, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { startOfDay, format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ sales: 0, expenses: 0, profit: 0 });

  useEffect(() => {
    if (!user) return;

    const beginOfDay = startOfDay(new Date());
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('timestamp', '>=', Timestamp.fromDate(beginOfDay)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTxns(docs);

      const totals = docs.reduce((acc, txn) => {
        if (txn.type === 'sale') acc.sales += txn.amount;
        else acc.expenses += txn.amount;
        return acc;
      }, { sales: 0, expenses: 0 });

      setStats({
        ...totals,
        profit: totals.sales - totals.expenses
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-8">
      {user?.isAnonymous && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/10 border border-blue-900/20 p-5 rounded-[1.5rem] flex flex-col gap-2 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/20 p-2 rounded-xl">
              <UserCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-bold text-blue-100 font-display text-lg">Welcome, Guest!</h4>
          </div>
          <p className="text-blue-200/70 text-sm font-display">
            You're currently using a temporary guest session. Your data is saved only on this device. Sign in with Google to sync across all your devices.
          </p>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#6B6359] uppercase tracking-[0.15em] mb-1">Your Daily Flow</h2>
          <p className="text-3xl font-bold font-display text-[#F9F7F2]">{format(new Date(), 'EEEE, do MMMM')}</p>
        </div>
        <div className="bg-[#25221F] p-3 rounded-2xl text-[#6B6359] border border-[#3D3935]">
           <Wallet className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-[#F9F7F2] text-[#1A1816] border-none relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-[#6B6359] text-sm font-medium mb-2 uppercase tracking-wide">Net Profit Today</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-display text-[#1A1816]">GHS {stats.profit.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {stats.profit >= 0 ? (
                <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-green-700/10 px-3 py-1.5 rounded-full border border-green-700/20">
                  <TrendingUp className="w-4 h-4" />
                  You're in the Green
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-red-700 text-sm font-semibold bg-red-700/10 px-3 py-1.5 rounded-full border border-red-700/20">
                  <TrendingDown className="w-4 h-4" />
                  Watching the Flow
                </span>
              )}
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 text-[#1A1816]">
            <BarChart3 className="w-32 h-32" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <p className="text-[#6B6359] text-xs font-bold uppercase tracking-wider mb-3">Total Sales</p>
            <p className="text-2xl font-bold text-[#F9F7F2] font-display">GHS {stats.sales.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-[#6B6359] text-xs font-bold uppercase tracking-wider mb-3">Total Expenses</p>
            <p className="text-2xl font-bold text-[#F9F7F2] font-display">GHS {stats.expenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {stats.expenses > stats.sales && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-[1.5rem] flex gap-4 items-center shadow-sm"
        >
          <div className="bg-amber-900/30 p-2.5 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-amber-200/80 text-sm font-medium font-display">
            "Steady as she goes. Your expenses are leaning a bit heavy today. Let's find some flow."
          </p>
        </motion.div>
      )}

      <div className="space-y-6">
        <h3 className="text-2xl font-bold font-display text-[#F9F7F2]">Latest Entries</h3>
        <div className="space-y-4">
          {txns.length === 0 ? (
            <div className="text-center py-12 card">
              <p className="text-[#6B6359] font-display">No entries yet. Start the flow today.</p>
            </div>
          ) : (
            txns.map(txn => (
              <motion.div 
                key={txn.id}
                layout
                className="flex items-center justify-between p-5 card hover:bg-[#2D2A26] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-2xl ${txn.type === 'sale' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                    {txn.type === 'sale' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#F9F7F2] font-display">{txn.category}</p>
                    <p className="text-sm text-[#6B6359]">{txn.note || 'No description provided'}</p>
                  </div>
                </div>
                <p className={`text-xl font-bold font-display ${txn.type === 'sale' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'sale' ? '+' : '-'} {txn.amount.toFixed(2)}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
