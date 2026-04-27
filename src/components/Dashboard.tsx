import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp, limit } from 'firebase/firestore';
import { db, Transaction } from '../firebase';
import { useAuth } from '../AuthContext';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart3, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startOfDay, format, startOfMonth } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ sales: 0, expenses: 0, profit: 0, count: 0 });
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;

    let beginOfTime: Date;
    if (timeframe === 'today') {
      beginOfTime = startOfDay(new Date());
    } else if (timeframe === 'week') {
      beginOfTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else {
      beginOfTime = startOfMonth(new Date());
    }

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('timestamp', '>=', Timestamp.fromDate(beginOfTime)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsSyncing(snapshot.metadata.hasPendingWrites);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTxns(docs);

      const totals = docs.reduce((acc, txn) => {
        if (txn.type === 'sale') acc.sales += txn.amount;
        else acc.expenses += txn.amount;
        return acc;
      }, { sales: 0, expenses: 0 });

      setStats({
        ...totals,
        profit: totals.sales - totals.expenses,
        count: docs.length
      });
    });

    return () => unsubscribe();
  }, [user, timeframe]);

  const categories = txns.reduce((acc: any, txn) => {
    acc[txn.category || 'General'] = (acc[txn.category || 'General'] || 0) + txn.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categories).sort((a: any, b: any) => b[1] - a[1])[0];

  return (
    <div className="space-y-8 pb-10">
      <AnimatePresence>
        {user?.isAnonymous && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-900/10 border border-blue-900/20 p-5 rounded-[1.5rem] flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-900/20 p-2 rounded-xl">
                <UserCircle className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="font-bold text-blue-100 font-display text-lg">Welcome, Guest!</h4>
            </div>
            <p className="text-blue-200/70 text-sm font-display">
              You're in a guest session. Your data is temporary. Sign in with Google to sync across all your devices and keep your flow safe.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-[#25221F] rounded-2xl border border-[#3D3935]">
          <button 
            onClick={() => setTimeframe('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-display transition-all ${timeframe === 'today' ? 'bg-[#F9F7F2] text-[#1A1816]' : 'text-[#6B6359]'}`}
          >
            TODAY
          </button>
          <button 
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-display transition-all ${timeframe === 'week' ? 'bg-[#F9F7F2] text-[#1A1816]' : 'text-[#6B6359]'}`}
          >
            WEEK
          </button>
          <button 
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-display transition-all ${timeframe === 'month' ? 'bg-[#F9F7F2] text-[#1A1816]' : 'text-[#6B6359]'}`}
          >
            MONTH
          </button>
        </div>
        <div className="text-right">
          {isSyncing ? (
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest animate-pulse">SYNCING DATA...</p>
              <p className="text-sm font-bold font-display text-[#F9F7F2]">{format(new Date(), 'MMM d, yyyy')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold font-display text-[#F9F7F2]">{format(new Date(), 'MMM d, yyyy')}</p>
              <p className="text-[10px] text-[#6B6359] uppercase tracking-widest font-bold">SYSTEM ACTIVE</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-[#F9F7F2] text-[#1A1816] border-none relative overflow-hidden p-6"
        >
          <div className="relative z-10">
            <p className="text-[#6B6359] text-xs font-bold mb-2 uppercase tracking-widest">
              Net Flow {timeframe === 'today' ? 'Today' : timeframe === 'week' ? 'This Week' : 'This Month'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-display text-[#1A1816]">GHS {stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stats.profit >= 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-700/10 px-3 py-1.5 rounded-full border border-green-700/20">
                    <TrendingUp className="w-4 h-4" />
                    POSITIVE FLOW
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-700 text-xs font-bold bg-red-700/10 px-3 py-1.5 rounded-full border border-red-700/20">
                    <TrendingDown className="w-4 h-4" />
                    NEGATIVE FLOW
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6B6359] font-bold uppercase tracking-tighter">TOTAL LOGS</p>
                <p className="text-xl font-bold font-display text-[#1A1816]">{stats.count}</p>
              </div>
            </div>
          </div>
          <BarChart3 className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 w-48 h-48 pointer-events-none" />
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 border-[#3D3935] bg-[#25221F]">
            <p className="text-[#6B6359] text-[10px] font-bold uppercase tracking-widest mb-2 text-center">Sales</p>
            <p className="text-2xl font-bold text-green-400 font-display text-center truncate">GHS {stats.sales.toFixed(0)}</p>
          </div>
          <div className="card p-5 border-[#3D3935] bg-[#25221F]">
            <p className="text-[#6B6359] text-[10px] font-bold uppercase tracking-widest mb-2 text-center">Expenses</p>
            <p className="text-2xl font-bold text-red-400 font-display text-center truncate">GHS {stats.expenses.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {topCategory && (
        <div className="card bg-[#25221F] border-[#3D3935] p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold font-display text-[#F9F7F2] uppercase tracking-widest">Category Impact</h3>
             <BarChart3 className="w-4 h-4 text-[#6B6359]" />
          </div>
          <div className="space-y-4">
            {Object.entries(categories).slice(0, 3).map(([cat, val]: any) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#D1CDC3]">{cat}</span>
                  <span className="text-[#F9F7F2]">GHS {val.toFixed(2)}</span>
                </div>
                <div className="h-1.5 bg-[#1A1816] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(val / (stats.sales + stats.expenses || 1)) * 100}%` }}
                    className="h-full bg-orange-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.expenses > stats.sales && timeframe === 'today' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-950/20 border border-orange-900/30 p-5 rounded-[1.5rem] flex gap-4 items-center shadow-sm"
        >
          <div className="bg-orange-900/30 p-2.5 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-orange-200/80 text-sm font-bold font-display leading-tight">
            Steady flow required. Expenses are exceeding sales today. Track carefully.
          </p>
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold font-display text-[#F9F7F2]">Recent Activity</h3>
          <span className="text-[10px] text-[#6B6359] font-bold uppercase tracking-widest bg-[#25221F] px-2 py-1 rounded-md border border-[#3D3935]">LIVE</span>
        </div>
        <div className="space-y-3">
          {txns.length === 0 ? (
            <div className="text-center py-16 card bg-transparent border-dashed border-[#3D3935]">
              <p className="text-[#6B6359] font-display font-medium text-sm">Waiting for your first entry...</p>
            </div>
          ) : (
            txns.map(txn => (
              <motion.div 
                key={txn.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 card bg-[#25221F] border-[#3D3935] hover:border-[#F9F7F2]/30 transition-all hover:bg-[#2A2724]"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${txn.type === 'sale' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {txn.type === 'sale' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-[#F9F7F2] font-display leading-none">{txn.category}</p>
                    <p className="text-[10px] text-[#6B6359] font-bold uppercase mt-1 tracking-tight">{txn.note || 'NO NOTE'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold font-display ${txn.type === 'sale' ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.type === 'sale' ? '+' : '-'} {txn.amount.toFixed(2)}
                  </p>
                  <p className="text-[8px] text-[#6B6359] font-bold uppercase tracking-tighter">
                   {format(txn.timestamp?.toDate() || new Date(), 'HH:mm')}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
