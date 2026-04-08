import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserProfile } from '../types/user';
import { subscribeToUser } from '../services/user.service';

const PROFILE_CACHE_KEY = 'gestionarse_profile';

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
    const unsub = onAuthStateChanged(auth, (u) => {
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
    if (cached && cached.uid === user.uid) {
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsub = subscribeToUser(user.uid, (p) => {
      clearTimeout(timeout);
      setProfile(p);
      cacheProfile(p);
      setLoading(false);
    });

    return () => { clearTimeout(timeout); unsub(); };
  }, [user]);

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
