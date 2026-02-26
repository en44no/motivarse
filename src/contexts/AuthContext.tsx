import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserProfile } from '../types/user';
import { subscribeToUser } from '../services/user.service';
import { toast } from 'sonner';

const PROFILE_CACHE_KEY = 'motivarse_profile';

function getCachedProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function cacheProfile(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch { /* ignore */ }
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(getCachedProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    toast.info('[DEBUG] Auth: escuchando estado...');
    const unsub = onAuthStateChanged(auth, (u) => {
      toast.info(`[DEBUG] Auth: user=${u ? u.uid.slice(0, 6) : 'null'}`);
      setUser(u);
      if (!u) {
        setProfile(null);
        cacheProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    const cached = getCachedProfile();
    toast.info(`[DEBUG] Profile: cache=${cached ? `uid=${cached.uid.slice(0,6)}, coupleId=${cached.coupleId || 'NULL'}` : 'NONE'}`);

    if (cached && cached.uid === user.uid) {
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      toast.error('[DEBUG] Profile: TIMEOUT 5s — Firestore no respondió');
      setLoading(false);
    }, 5000);

    const unsub = subscribeToUser(user.uid, (p) => {
      clearTimeout(timeout);
      toast.success(`[DEBUG] Profile: Firestore respondió — coupleId=${p?.coupleId || 'NULL'}, name=${p?.displayName || 'none'}`);
      setProfile(p);
      cacheProfile(p);
      setLoading(false);
    });

    return () => { clearTimeout(timeout); unsub(); };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
