import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { GlassCard } from './GlassCard';
import { CheckSquare, ExternalLink, CheckCircle2, AlertCircle, MessageCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '../lib/utils';

const Tasks = () => {
  const { user, tasks, userTasks, language } = useApp();
  const t = translations[language];
  const [checking, setChecking] = useState<string | null>(null);

  const handleCheckTask = async (taskId: string, reward: number) => {
    if (!user) return;
    setChecking(taskId);

    // Simulate Telegram Subscription Check
    // In a real app, you'd call a backend API that uses a Telegram Bot to check the user's status
    setTimeout(async () => {
      setChecking(null);
      
      const userTaskRef = doc(db, 'userTasks', `${user.uid}_${taskId}`);
      const userRef = doc(db, 'users', user.uid);

      try {
        await setDoc(userTaskRef, {
          uid: user.uid,
          taskId,
          status: 'completed',
          completedAt: new Date().toISOString(),
        });

        await updateDoc(userRef, {
          balance: increment(reward),
          totalBirrEarned: increment(reward),
          totalTasksCompleted: increment(1),
        });

        alert(t.success + " +" + reward + " " + t.etb);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `userTasks/${user.uid}_${taskId}`);
      }
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
          <CheckSquare size={28} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold">{t.tasks}</h1>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No tasks available right now</p>
        ) : (
          tasks.map((task) => {
            const isCompleted = userTasks.includes(task.id);

            return (
              <GlassCard key={task.id} className={cn("relative overflow-hidden", isCompleted && "opacity-60")}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    task.type === 'channel' ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                  )}>
                    {task.type === 'channel' ? <MessageCircle size={24} /> : <Users size={24} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{task.title}</h4>
                    <p className="text-xs text-gray-500 mb-4">{task.description}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg border border-blue-400/20">
                        +{task.reward} {t.etb}
                      </span>
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded-lg border border-green-400/20">
                          <CheckCircle2 size={12} />
                          {t.completed}
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-1">
                          <a 
                            href={task.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                          >
                            <ExternalLink size={14} />
                            {t.subscribe}
                          </a>
                          <button
                            onClick={() => handleCheckTask(task.id, task.reward)}
                            disabled={checking === task.id}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            {checking === task.id ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <><CheckCircle2 size={14} /> {t.check}</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-blue-400" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Make sure to stay subscribed to the channels to keep your rewards. Unsubscribing may lead to balance deduction or account ban.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default Tasks;
