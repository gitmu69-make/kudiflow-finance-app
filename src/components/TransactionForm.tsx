import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuth } from '../AuthContext';
import { Plus, Minus, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TransactionForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [type, setType] = useState<'sale' | 'expense'>('sale');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    setIsSubmitting(true);
    try {
      const txnData = {
        userId: user.uid,
        type,
        amount: parseFloat(amount),
        category: category || 'General',
        note,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'transactions'), txnData);
      setAmount('');
      setCategory('');
      setNote('');
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${user.uid}/transactions`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-[#6B6359] text-sm uppercase tracking-widest font-bold mb-2">New Entry</p>
        <h2 className="text-3xl font-bold font-display text-[#F9F7F2]">What's the flow today?</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-3 p-1.5 bg-[#25221F] rounded-[1.5rem] border border-[#3D3935]">
          <button
            type="button"
            onClick={() => setType('sale')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.25rem] font-bold transition-all ${
              type === 'sale' ? 'bg-[#F9F7F2] shadow-md text-green-700' : 'text-[#6B6359]'
            }`}
          >
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-display text-lg">Sale</span>
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.25rem] font-bold transition-all ${
              type === 'expense' ? 'bg-[#F9F7F2] shadow-md text-red-700' : 'text-[#6B6359]'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-display text-lg">Expense</span>
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6B6359] font-bold font-display text-xl">GHS</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field pl-20 text-3xl font-bold font-display"
            required
            autoFocus
          />
        </div>

        <div className="space-y-4">
          <div className="bg-[#25221F] p-2 rounded-[1.25rem] border border-[#3D3935] shadow-sm">
            <input
              type="text"
              placeholder="Category (e.g. Supplies, Food...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent p-4 outline-none font-display text-lg text-[#F9F7F2]"
            />
          </div>
          <div className="bg-[#25221F] p-2 rounded-[1.25rem] border border-[#3D3935] shadow-sm">
             <textarea
              placeholder="Add a small note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-transparent p-4 outline-none font-display text-lg min-h-[100px] resize-none text-[#F9F7F2]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className="btn-primary w-full flex items-center justify-center gap-3 py-5 text-xl disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin text-[#1A1816]" /> : <Plus className="w-6 h-6 text-[#1A1816]" />}
          <span className="font-display font-bold">Log this Transaction</span>
        </button>
      </form>
    </div>
  );
};
