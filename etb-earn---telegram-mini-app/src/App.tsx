import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { translations } from './translations';
import { GlassCard } from './components/GlassCard';
import { Home, Trophy, User as UserIcon, Wallet, CheckSquare, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Components
import AdWatcher from './components/AdWatcher';
import Leaderboard from './components/Leaderboard';
import Account from './components/Account';
import Withdraw from './components/Withdraw';
import Tasks from './components/Tasks';
import AdminPanel from './components/AdminPanel';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to} className={cn(
    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
    active ? "text-blue-400 bg-blue-400/10" : "text-gray-400 hover:text-gray-200"
  )}>
    <Icon size={24} />
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </Link>
);

const Navigation = () => {
  const { language, isAdmin } = useApp();
  const t = translations[language];
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex justify-around items-center shadow-2xl z-50">
      <NavItem to="/" icon={Home} label={t.watchAds} active={location.pathname === '/'} />
      <NavItem to="/tasks" icon={CheckSquare} label={t.tasks} active={location.pathname === '/tasks'} />
      <NavItem to="/leaderboard" icon={Trophy} label={t.leaderboard} active={location.pathname === '/leaderboard'} />
      <NavItem to="/withdraw" icon={Wallet} label={t.withdraw} active={location.pathname === '/withdraw'} />
      <NavItem to="/account" icon={UserIcon} label={t.account} active={location.pathname === '/account'} />
      {isAdmin && (
        <NavItem to="/admin" icon={Settings} label={t.admin} active={location.pathname === '/admin'} />
      )}
    </nav>
  );
};

const AppContent = () => {
  const { user, loading, language, setLanguage, isAdmin } = useApp();
  const t = translations[language];

  const location = useLocation();

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (user.isBanned) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">{t.banned}</h1>
        <p className="text-gray-400 mb-6">{t.contactSupport}</p>
        <a href="https://t.me/admin" className="bg-white/10 px-6 py-3 rounded-xl flex items-center gap-2">
          <MessageCircle size={20} />
          Telegram Support
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="p-6 flex justify-between items-center">
        <div>
          <h2 className="text-gray-400 text-sm font-medium">{t.balance}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {user.balance.toFixed(2)}
            </span>
            <span className="text-blue-400 font-bold text-sm">{t.etb}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-all"
          >
            {language.toUpperCase()}
          </button>
          <Link to="/account" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500/20">
                <UserIcon size={20} className="text-blue-400" />
              </div>
            )}
          </Link>
        </div>
      </header>

      <main className="px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location}>
              <Route path="/" element={<AdWatcher />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/account" element={<Account />} />
              {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
