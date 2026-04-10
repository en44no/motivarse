import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ROUTES } from '../config/routes';

export function LoginPage() {
  const { user } = useAuthContext();
  const { login, googleLogin, register, error, isSubmitting, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (user) return <Navigate to={ROUTES.DASHBOARD} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isRegister) {
      await register(email, password, displayName);
    } else {
      await login(email, password);
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister);
    clearError();
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Single subtle background glow — reduced from 2 to 1 for perf */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-primary-soft) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-hover mb-4 shadow-[var(--shadow-glow-primary)]">
          <Flame size={38} className="text-primary-contrast" />
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight leading-tight">
          Gestionarse
        </h1>
        <p className="text-sm text-text-muted mt-1">Organizate en pareja</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-surface rounded-3xl border border-border/60 p-6 shadow-lg">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-text-primary leading-tight">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isRegister
                ? 'Empezá a organizarte con tu pareja'
                : 'Bienvenido de vuelta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <Input
                    label="Tu nombre"
                    placeholder="Ej: Nahuel"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              error={error || undefined}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              {isRegister ? 'Crear cuenta' : 'Entrar'}
              <ArrowRight size={18} />
            </Button>
          </form>

          {!isRegister && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-2xs text-text-muted uppercase tracking-wide">
                  o continuá con
                </span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              <button
                type="button"
                onClick={googleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border/80 bg-surface-alt hover:bg-surface-hover hover:border-border-light text-text-primary text-sm font-semibold transition-colors duration-150 ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>

        <button
          onClick={toggleMode}
          className="w-full text-center mt-4 text-sm text-text-muted hover:text-text-secondary transition-colors duration-150 py-2"
        >
          {isRegister
            ? '¿Ya tenés cuenta? Iniciá sesión'
            : '¿No tenés cuenta? Registrate'}
        </button>
      </motion.div>
    </div>
  );
}
