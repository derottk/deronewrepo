import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { User as UserIcon, Award, Share2, Copy, Check, LogOut, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const Account = () => {
  const { user, language, logout, isAdmin } = useApp();
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = `${window.location.origin}?ref=${user.uid}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const achievements = [
    { id: 1, title: "Watched 100 ads", value: 100, current: user.totalAdsWatched, icon: Star },
    { id: 2, title: "Earned 50 Birr", value: 50, current: user.totalBirrEarned, icon: Award },
    { id: 3, title: "Invited 10 friends", value: 10, current: user.inviteCount, icon: Share2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <GlassCard className="text-center py-8">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-blue-500/30 shadow-2xl">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500/20">
                <UserIcon size={40} className="text-blue-400" />
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-xl border-2 border-[#0a0a0a]">
              <ShieldCheck size={16} />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-1">{user.firstName}</h2>
        <p className="text-gray-500 text-sm mb-6">ID: {user.uid.slice(0, 8)}...</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">{user.totalAdsWatched}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.totalAds}</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-xl font-bold text-purple-400">{user.totalBirrEarned.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.totalEarned}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-orange-400">{user.inviteCount}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.invites}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Share2 size={18} className="text-blue-400" />
          {t.referralLink}
        </h4>
        <p className="text-xs text-gray-500 mb-4">{t.inviteFriends}</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm truncate text-gray-400 font-mono">
            {referralLink}
          </div>
          <button 
            onClick={copyToClipboard}
            className={cn(
              "p-3 rounded-xl transition-all active:scale-90",
              copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            )}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </GlassCard>

      <div className="space-y-3">
        <h4 className="font-bold px-1">{t.achievements}</h4>
        {achievements.map((achievement) => {
          const progress = Math.min(achievement.current / achievement.value, 1);
          const isUnlocked = progress >= 1;
          const Icon = achievement.icon;

          return (
            <GlassCard key={achievement.id} className={cn("flex items-center gap-4", !isUnlocked && "opacity-60 grayscale")}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                isUnlocked ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : "bg-white/5 border-white/10 text-gray-500"
              )}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-sm">{achievement.title}</h5>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{achievement.current}/{achievement.value}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <button 
        onClick={logout}
        className="w-full py-4 text-red-400 font-bold flex items-center justify-center gap-2 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-all"
      >
        <LogOut size={20} />
        {t.logout}
      </button>
    </motion.div>
  );
};

export default Account;
