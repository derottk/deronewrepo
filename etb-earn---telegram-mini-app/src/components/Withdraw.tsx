import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { Wallet, Landmark, User as UserIcon, Send, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';
import { WithdrawalRequest } from '../types';
import { cn } from '../lib/utils';

const Withdraw = () => {
  const { user, adConfig, language, updateUser } = useApp();
  const t = translations[language];
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const banks = ['CBE', 'Dashen Bank', 'Awash Bank', 'Bank of Abyssinia', 'Wegagen Bank', 'Telebirr'];

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'withdrawals'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'withdrawals'));

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !adConfig) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < adConfig.minWithdrawal || numAmount > adConfig.maxWithdrawal) {
      alert(`${t.minWithdrawal}: ${adConfig.minWithdrawal}, ${t.maxWithdrawal}: ${adConfig.maxWithdrawal}`);
      return;
    }

    if (numAmount > user.balance) {
      alert("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      // Deduct balance first
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(-numAmount)
      });

      // Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        uid: user.uid,
        firstName: user.firstName,
        bank,
        accountName,
        amount: numAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setBank('');
      setAccountName('');
      setAmount('');
      alert(t.success);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'withdrawals');
    } finally {
      setLoading(false);
    }
  };

  if (!adConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <Wallet size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">{t.withdraw}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block px-1">{t.bank}</label>
            <div className="grid grid-cols-2 gap-2">
              {banks.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBank(b)}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-medium transition-all",
                    bank === b ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block px-1">{t.accountName}</label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block px-1">{t.amount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">ETB</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={adConfig.minWithdrawal}
                max={adConfig.maxWithdrawal}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-14 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between mt-2 px-1">
              <p className="text-[10px] text-gray-500">{t.minWithdrawal}: {adConfig.minWithdrawal}</p>
              <p className="text-[10px] text-gray-500">{t.maxWithdrawal}: {adConfig.maxWithdrawal}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !bank || !accountName || !amount}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2",
              loading || !bank || !accountName || !amount
                ? "bg-white/5 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20"
            )}
          >
            {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" /> : <><Send size={20} /> {t.submit}</>}
          </button>
        </form>
      </GlassCard>

      <div className="space-y-3">
        <h4 className="font-bold px-1">Recent Requests</h4>
        {requests.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">No withdrawal history yet</p>
        ) : (
          requests.map((req) => (
            <GlassCard key={req.id} className="flex items-center gap-4 p-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                req.status === 'approved' ? "bg-green-500/20 border-green-500/30 text-green-400" :
                req.status === 'rejected' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
              )}>
                {req.status === 'approved' ? <CheckCircle2 size={20} /> :
                 req.status === 'rejected' ? <XCircle size={20} /> :
                 <Clock size={20} />}
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-sm">{req.bank}</h5>
                <p className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{req.amount} {t.etb}</p>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  req.status === 'approved' ? "text-green-400" :
                  req.status === 'rejected' ? "text-red-400" :
                  "text-yellow-400"
                )}>{t[req.status]}</p>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Withdraw;
