import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { registerUser, loginUser, logoutUser, linkPartner } from '../services/auth.service';

export function useAuth() {
  const { user, profile, loading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login(email: string, password: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginUser(email, password);
    } catch (e: any) {
      const msg = e.code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos'
        : e.code === 'auth/too-many-requests'
        ? 'Demasiados intentos. Esperá un momento.'
        : 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(email: string, password: string, displayName: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser(email, password, displayName);
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'Este email ya está en uso'
        : e.code === 'auth/weak-password'
        ? 'La contraseña debe tener al menos 6 caracteres'
        : 'Error al registrarse';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    await logoutUser();
  }

  async function link(partnerEmail: string) {
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await linkPartner(user.uid, partnerEmail);
    } catch (e: any) {
      setError(e.message || 'Error al vincular pareja');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isSubmitting,
    login,
    register,
    logout,
    linkPartner: link,
    clearError: () => setError(null),
  };
}
