import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { Play, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

import { cn } from '../lib/utils';

const AdWatcher = () => {
  const { user, adConfig, language, updateUser } = useApp();
  const t = translations[language];
  const [cooldown, setCooldown] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.lastAdWatchedAt && adConfig) {
      const lastWatched = new Date(user.lastAdWatchedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - lastWatched) / 1000);
      const remaining = adConfig.cooldownSeconds - diff;
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, [user, adConfig]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleWatchAd = async () => {
    if (cooldown > 0 || !adConfig || !user) return;
    if (user.adsWatchedToday >= adConfig.dailyLimit) {
      alert(t.dailyLimit + " reached");
      return;
    }

    setIsWatching(true);

    // Simulate Monetag Ad Loading & Watching
    // In a real app, you'd trigger the Monetag SDK here
    // window.monetag.showAd();
    
    setTimeout(async () => {
      setIsWatching(false);
      setShowSuccess(true);
      
      // Update User Data
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          balance: increment(adConfig.rewardPerAd),
          totalAdsWatched: increment(1),
          totalBirrEarned: increment(adConfig.rewardPerAd),
          adsWatchedToday: increment(1),
          lastAdWatchedAt: new Date().toISOString(),
        });
        
        // Handle Referral Commission (5%)
        if (user.referrerUid) {
          const referrerRef = doc(db, 'users', user.referrerUid);
          const commission = adConfig.rewardPerAd * 0.05;
          await updateDoc(referrerRef, {
            balance: increment(commission),
            totalBirrEarned: increment(commission),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }

      setTimeout(() => setShowSuccess(false), 3000);
    }, 5000); // Simulate 5s ad
  };

  if (!adConfig) return null;

  const progress = (user?.adsWatchedToday || 0) / adConfig.dailyLimit;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <GlassCard className="text-center py-10 relative overflow-hidden">
        {isWatching && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 mb-4"
            >
              <Play size={40} className="text-blue-400 fill-blue-400" />
            </motion.div>
            <p className="text-lg font-bold">{t.wait}...</p>
          </div>
        )}

        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <CheckCircle2 size={64} className="text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-green-400">+{adConfig.rewardPerAd} {t.etb}</h3>
            <p className="text-gray-400">{t.success}</p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Play size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-1">{t.watchAds}</h3>
              <p className="text-gray-400 text-sm">{t.earnByWatching}</p>
            </div>

            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.dailyLimit}</p>
                <p className="text-lg font-bold">{user?.adsWatchedToday}/{adConfig.dailyLimit}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.cooldown}</p>
                <p className="text-lg font-bold">{cooldown > 0 ? `${cooldown}s` : "READY"}</p>
              </div>
            </div>

            <button
              onClick={handleWatchAd}
              disabled={cooldown > 0 || isWatching}
              className={cn(
                "w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                cooldown > 0 || isWatching 
                  ? "bg-white/5 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20"
              )}
            >
              {cooldown > 0 ? (
                <><Clock size={20} /> {t.wait} {cooldown}s</>
              ) : (
                <><Play size={20} fill="currentColor" /> {t.watchAds}</>
              )}
            </button>
          </>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold">{t.dailyLimit}</h4>
          <span className="text-sm text-gray-400">{Math.round(progress * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
        <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {t.remaining}: {adConfig.dailyLimit - (user?.adsWatchedToday || 0)}
        </p>
      </GlassCard>

      {/* Monetag Script Placeholder */}
      <div className="text-[10px] text-gray-800 text-center opacity-20">
        Monetag Ad Integration Active
      </div>
    </motion.div>
  );
};

export default AdWatcher;
