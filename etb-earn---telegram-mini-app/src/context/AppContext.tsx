import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { User, AdConfig, Task, UserTask } from '../types';
import { useTelegram } from '../hooks/useTelegram';

interface AppContextType {
  user: User | null;
  adConfig: AdConfig | null;
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  tasks: Task[];
  userTasks: string[];
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<string[]>([]);
  const { user: tgUser } = useTelegram();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('referrerUid', ref);
    }
  }, []);

  useEffect(() => {
    const loginAnonymously = async () => {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Anonymous login failed", error);
      }
    };
    loginAnonymously();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Use Telegram ID if available, otherwise use 'test_user'
        const userId = tgUser?.id ? `tg_${tgUser.id}` : 'test_user';
        const userRef = doc(db, 'users', userId);
        
        // Listen to user data
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setUser(userData);
            setLanguage(userData.language || 'en');
            setLoading(false);
          } else {
            // Create new user if doesn't exist
            const referrerUid = localStorage.getItem('referrerUid') || undefined;
            const newUser: User = {
              uid: userId,
              firstName: tgUser?.first_name || 'Test User',
              photoUrl: tgUser?.photo_url || '',
              balance: 0,
              totalAdsWatched: 0,
              totalBirrEarned: 0,
              totalTasksCompleted: 0,
              inviteCount: 0,
              referrerUid,
              language: 'en',
              isBanned: false,
              adsWatchedToday: 0,
              createdAt: new Date().toISOString(),
            };
            setDoc(userRef, newUser).then(() => {
              // Update inviter's count
              if (referrerUid) {
                const referrerRef = doc(db, 'users', referrerUid);
                updateDoc(referrerRef, { inviteCount: increment(1) });
              }
              localStorage.removeItem('referrerUid');
              setLoading(false);
            }).catch(e => {
              handleFirestoreError(e, OperationType.CREATE, `users/${userId}`);
              setLoading(false);
            });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userId}`);
          setLoading(false);
        });

        // Listen to user tasks
        const tasksQuery = query(collection(db, 'userTasks'));
        const unsubscribeUserTasks = onSnapshot(tasksQuery, (snapshot) => {
          const completed = snapshot.docs
            .filter(doc => doc.id.startsWith(userId))
            .map(doc => doc.data().taskId);
          setUserTasks(completed);
        });

        return () => {
          unsubscribeUser();
          unsubscribeUserTasks();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen to global config
    const configRef = doc(db, 'adConfig', 'global');
    const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdConfig(docSnap.data() as AdConfig);
      } else {
        // Initialize default config if missing
        const defaultConfig: AdConfig = {
          rewardPerAd: 0.5,
          dailyLimit: 20,
          cooldownSeconds: 60,
          minWithdrawal: 50,
          maxWithdrawal: 1000,
        };
        setDoc(configRef, defaultConfig).catch(e => handleFirestoreError(e, OperationType.CREATE, 'adConfig/global'));
      }
      // Only set loading false if we have a user or if auth failed
      if (auth.currentUser) {
        // User data listener will handle it
      } else {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'adConfig/global');
      setLoading(false);
    });

    // Listen to tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('isActive', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConfig();
      unsubscribeTasks();
    };
  }, [tgUser]);

  const logout = async () => {
    await auth.signOut();
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const isAdmin = user?.role === 'admin' || auth.currentUser?.email === 'maktame7@gmail.com';

  return (
    <AppContext.Provider value={{ 
      user, 
      adConfig, 
      language, 
      setLanguage, 
      loading, 
      logout, 
      updateUser,
      tasks,
      userTasks,
      isAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
