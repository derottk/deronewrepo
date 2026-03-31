import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { Settings, Users, Wallet, CheckSquare, BarChart3, Plus, Trash2, Check, X, Ban, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, deleteDoc, addDoc, getDocs, increment } from 'firebase/firestore';
import { User, AdConfig, Task, WithdrawalRequest } from '../types';
import { cn } from '../lib/utils';

const AdminPanel = () => {
  const { user, adConfig, language } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'tasks' | 'config'>('users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(50)), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
      setAllWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
    });

    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), (snapshot) => {
      setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubWithdrawals();
      unsubTasks();
    };
  }, []);

  const handleApproveWithdrawal = async (req: WithdrawalRequest) => {
    if (!req.id) return;
    try {
      await updateDoc(doc(db, 'withdrawals', req.id), { status: 'approved' });
      alert("Approved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `withdrawals/${req.id}`);
    }
  };

  const handleRejectWithdrawal = async (req: WithdrawalRequest) => {
    if (!req.id) return;
    try {
      // Refund balance
      const userRef = doc(db, 'users', req.uid);
      await updateDoc(userRef, { balance: increment(req.amount) });
      await updateDoc(doc(db, 'withdrawals', req.id), { status: 'rejected' });
      alert("Rejected and Refunded!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `withdrawals/${req.id}`);
    }
  };

  const handleToggleBan = async (u: User) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { isBanned: !u.isBanned });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${u.uid}`);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newConfig = {
      rewardPerAd: parseFloat(formData.get('rewardPerAd') as string),
      dailyLimit: parseInt(formData.get('dailyLimit') as string),
      cooldownSeconds: parseInt(formData.get('cooldownSeconds') as string),
      minWithdrawal: parseFloat(formData.get('minWithdrawal') as string),
      maxWithdrawal: parseFloat(formData.get('maxWithdrawal') as string),
    };
    try {
      await updateDoc(doc(db, 'adConfig', 'global'), newConfig);
      alert("Config Updated!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'adConfig/global');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newTask = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      link: formData.get('link') as string,
      reward: parseFloat(formData.get('reward') as string),
      isActive: true,
    };
    try {
      await addDoc(collection(db, 'tasks'), newTask);
      (e.target as HTMLFormElement).reset();
      alert("Task Added!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
          <ShieldCheck size={28} className="text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'withdrawals', icon: Wallet, label: 'Withdrawals' },
          { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
          { id: 'config', icon: Settings, label: 'Config' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-3">
          {allUsers.map(u => (
            <GlassCard key={u.uid} className="flex items-center gap-4 p-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                {u.photoUrl ? <img src={u.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-blue-500/20 flex items-center justify-center"><Users size={16} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-sm truncate">{u.firstName}</h5>
                <p className="text-[10px] text-gray-500">{u.balance.toFixed(2)} ETB • {u.totalAdsWatched} Ads</p>
              </div>
              <button 
                onClick={() => handleToggleBan(u)}
                className={cn("p-2 rounded-lg transition-all", u.isBanned ? "bg-red-500 text-white" : "bg-white/5 text-gray-500")}
              >
                <Ban size={16} />
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-3">
          {allWithdrawals.map(w => (
            <GlassCard key={w.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold">{w.firstName}</h5>
                  <p className="text-xs text-gray-500">{w.bank} • {w.accountName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">{w.amount} ETB</p>
                  <p className={cn("text-[10px] font-bold uppercase", w.status === 'approved' ? "text-green-400" : w.status === 'rejected' ? "text-red-400" : "text-yellow-400")}>{w.status}</p>
                </div>
              </div>
              {w.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApproveWithdrawal(w)} className="flex-1 bg-green-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Check size={14} /> Approve</button>
                  <button onClick={() => handleRejectWithdrawal(w)} className="flex-1 bg-red-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><X size={14} /> Reject</button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <GlassCard>
            <h4 className="font-bold mb-4">Add New Task</h4>
            <form onSubmit={handleAddTask} className="space-y-3">
              <input name="title" placeholder="Task Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" required />
              <textarea name="description" placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" required />
              <select name="type" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-400">
                <option value="channel">Channel</option>
                <option value="group">Group</option>
              </select>
              <input name="link" placeholder="Telegram Link" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" required />
              <input name="reward" type="number" step="0.1" placeholder="Reward (ETB)" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" required />
              <button type="submit" className="w-full bg-blue-600 py-3 rounded-xl font-bold text-sm">Add Task</button>
            </form>
          </GlassCard>

          <div className="space-y-3">
            {allTasks.map(t => (
              <GlassCard key={t.id} className="flex items-center gap-4 p-3">
                <div className="flex-1">
                  <h5 className="font-bold text-sm">{t.title}</h5>
                  <p className="text-[10px] text-gray-500">{t.reward} ETB • {t.type}</p>
                </div>
                <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'config' && adConfig && (
        <GlassCard>
          <h4 className="font-bold mb-4">Global Configuration</h4>
          <form onSubmit={handleUpdateConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Reward per Ad</label>
                <input name="rewardPerAd" type="number" step="0.01" defaultValue={adConfig.rewardPerAd} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Daily Limit</label>
                <input name="dailyLimit" type="number" defaultValue={adConfig.dailyLimit} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Cooldown (s)</label>
                <input name="cooldownSeconds" type="number" defaultValue={adConfig.cooldownSeconds} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Min Withdrawal</label>
                <input name="minWithdrawal" type="number" defaultValue={adConfig.minWithdrawal} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Max Withdrawal</label>
                <input name="maxWithdrawal" type="number" defaultValue={adConfig.maxWithdrawal} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20">Update Settings</button>
          </form>
        </GlassCard>
      )}
    </motion.div>
  );
};

export default AdminPanel;
