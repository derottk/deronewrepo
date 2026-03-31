import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { Trophy, Medal, User as UserIcon, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { User } from '../types';
import { cn } from '../lib/utils';

const Leaderboard = () => {
  const { language } = useApp();
  const t = translations[language];
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalBirrEarned', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopUsers(snapshot.docs.map(doc => doc.data() as User));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30">
          <Trophy size={28} className="text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold">{t.leaderboard}</h1>
      </div>

      <div className="space-y-3">
        {topUsers.map((user, index) => (
          <GlassCard key={user.uid} className={cn(
            "flex items-center gap-4 p-3 transition-all hover:bg-white/15",
            index === 0 ? "border-yellow-500/40 bg-yellow-500/5" : 
            index === 1 ? "border-gray-400/40 bg-gray-400/5" :
            index === 2 ? "border-orange-500/40 bg-orange-500/5" : ""
          )}>
            <div className="w-8 text-center font-bold text-gray-500">
              {index === 0 ? <Medal className="text-yellow-400 mx-auto" /> : 
               index === 1 ? <Medal className="text-gray-400 mx-auto" /> :
               index === 2 ? <Medal className="text-orange-500 mx-auto" /> :
               index + 1}
            </div>
            
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500/20">
                  <UserIcon size={20} className="text-blue-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold truncate">{user.firstName}</h4>
                {user.inviteCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full border border-blue-500/30">
                    <Award size={10} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400">{user.inviteCount}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">{user.totalAdsWatched} {t.totalAds}</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-blue-400">{user.totalBirrEarned.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.etb}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
};

export default Leaderboard;
