import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserProfile } from '../types/user';
import { subscribeToUser } from '../services/user.service';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Timeout: si Firestore no responde en 5s, solo dejar de bloquear loading
    // NO crear perfil falso con coupleId:null — eso rompe la vinculación de pareja
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsub = subscribeToUser(user.uid, (p) => {
      clearTimeout(timeout);
      setProfile(p);
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
