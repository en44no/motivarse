import { useState } from 'react';
import {
  LogOut,
  Link as LinkIcon,
  Download,
  User,
  Flame,
  Footprints,
  Trophy,
  Smartphone,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  RefreshCw,
  Rows3,
  Rows4,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { useStreaks } from '../hooks/useStreaks';
import { useRunning } from '../hooks/useRunning';
import { useAchievements, getProgress } from '../hooks/useAchievements';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDensity } from '../contexts/DensityContext';
import { usePWA } from '../hooks/usePWA';
import { updateUserSettings } from '../services/user.service';
import { requestPushPermission, disablePushNotifications } from '../lib/notifications';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SettingToggle } from '../components/ui/SettingToggle';
import { ThemeSelector } from '../components/profile/ThemeSelector';
import { AchievementsSection } from '../components/profile/AchievementsSection';
import type { AchievementDef } from '../types/shared';

export function ProfilePage() {
  const { profile, logout, linkPartner, error, isSubmitting } = useAuth();
  const { user } = useAuthContext();
  const { streaks } = useStreaks();
  const { progress } = useRunning();
  const { couple, partnerName } = useCoupleContext();
  const { canInstall, install, isInstalled } = usePWA();
  const { isCompact, toggleDensity } = useDensity();
  const [partnerEmail, setPartnerEmail] = useState('');
  const { unlockedAchievements, evalCtx } = useAchievements();
  const { currentTheme, setTheme, themes } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDef | null>(null);
  const soundEnabled = profile?.settings?.soundEnabled ?? true;
  const notificationsEnabled = profile?.notificationsEnabled ?? false;

  async function toggleNotifications() {
    if (!user) return;
    if (notificationsEnabled) {
      await disablePushNotifications(user.uid);
      toast('Notificaciones desactivadas');
    } else {
      const success = await requestPushPermission(user.uid);
      if (!success) {
        toast.error(
          'No se pudo activar las notificaciones. Revisá los permisos del navegador.',
        );
      }
    }
  }

  async function toggleSound() {
    if (!user) return;
    await updateUserSettings(user.uid, { soundEnabled: !soundEnabled });
  }

  function handleLogout() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    setShowLogoutConfirm(false);
    logout();
  }

  async function forceUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } finally {
      window.location.reload();
    }
  }

  const totalStreaks = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
  const bestStreak = streaks.reduce((best, s) => Math.max(best, s.longestStreak), 0);

  // Use profile.coupleId OR couple from CoupleContext (cached in localStorage)
  const hasPartner = !!profile?.coupleId || !!couple;
  const profileLoaded = !!profile;

  const statCards: Array<{
    icon: React.ReactNode;
    value: number | string;
    label: string;
  }> = [
    {
      icon: <Flame size={18} className="text-secondary" />,
      value: bestStreak,
      label: 'Mejor racha',
    },
    {
      icon: <Footprints size={18} className="text-primary" />,
      value: progress?.totalRuns || 0,
      label: 'Carreras',
    },
    {
      icon: <Trophy size={18} className="text-accent" />,
      value: totalStreaks,
      label: 'Racha total',
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <h1 className="sr-only">Perfil</h1>

      {/* Profile header — compacto */}
      <section
        className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm"
        aria-label="Información de usuario"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-soft to-accent-soft ring-1 ring-primary/20">
            <User size={26} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-text-primary">
              {profile?.displayName || user?.displayName || 'Usuario'}
            </h2>
            <p className="truncate text-xs text-text-muted">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        {/* Stats row dentro del header para compactar */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="mb-1 flex justify-center">{stat.icon}</div>
              <p className="text-xl font-bold tabular-nums text-text-primary leading-none">
                {stat.value}
              </p>
              <p className="mt-1 text-2xs uppercase tracking-wide text-text-muted">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Partner linking */}
      {profileLoaded && !hasPartner && (
        <section
          className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm"
          aria-label="Vincular pareja"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft ring-1 ring-accent/20">
              <LinkIcon size={18} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary">
                Vincular pareja
              </h3>
              <p className="text-xs text-text-muted">Ingresá el email de tu pareja</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="email@pareja.com"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              error={error || undefined}
            />
            <Button
              onClick={() => linkPartner(partnerEmail)}
              isLoading={isSubmitting}
              className="shrink-0"
            >
              Vincular
            </Button>
          </div>
        </section>
      )}

      {hasPartner && (
        <section
          className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary-soft/40 to-surface p-4 shadow-sm"
          aria-label="Estado de pareja"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/20">
              <LinkIcon size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary">
                Pareja vinculada
              </h3>
              <p className="text-xs text-text-muted">
                Con {partnerName || 'tu pareja'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-primary">
              Conectados
            </span>
          </div>
        </section>
      )}

      {/* PWA state */}
      {canInstall && !isInstalled && (
        <button
          type="button"
          onClick={install}
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 text-left shadow-sm transition-colors duration-150 hover:border-border-light hover:bg-surface-hover active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/20">
            <Download size={18} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Instalar app</h3>
            <p className="text-xs text-text-muted">Agregala a tu pantalla de inicio</p>
          </div>
        </button>
      )}

      {isInstalled && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/20">
            <Smartphone size={18} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">App instalada</h3>
            <p className="text-xs text-text-muted">
              Ya tenés Motivarse en tu dispositivo
            </p>
          </div>
        </div>
      )}

      {/* Settings group */}
      <div className="space-y-2">
        <p className="px-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
          Preferencias
        </p>
        <div className="space-y-2">
          <SettingToggle
            icon={<Volume2 size={18} className="text-primary" />}
            iconOff={<VolumeX size={18} className="text-text-muted" />}
            title="Sonidos"
            description={soundEnabled ? 'Activados' : 'Desactivados'}
            enabled={soundEnabled}
            onToggle={toggleSound}
          />

          <SettingToggle
            icon={<Bell size={18} className="text-primary" />}
            iconOff={<BellOff size={18} className="text-text-muted" />}
            title="Notificaciones"
            description={
              notificationsEnabled
                ? 'Activadas · recordatorio diario a las 22:00'
                : 'Desactivadas'
            }
            enabled={notificationsEnabled}
            onToggle={toggleNotifications}
          />

          <SettingToggle
            icon={<Rows4 size={18} className="text-primary" />}
            iconOff={<Rows3 size={18} className="text-text-muted" />}
            title="Modo compacto"
            description="Ver más items por pantalla en las listas"
            enabled={isCompact}
            onToggle={toggleDensity}
          />
        </div>
      </div>

      {/* Achievements */}
      <AchievementsSection
        showAchievements={showAchievements}
        setShowAchievements={setShowAchievements}
        unlockedAchievements={unlockedAchievements}
        evalCtx={evalCtx}
        selectedAchievement={selectedAchievement}
        setSelectedAchievement={setSelectedAchievement}
      />

      {/* Theme selector */}
      <ThemeSelector currentTheme={currentTheme} themes={themes} setTheme={setTheme} />

      {/* Danger/meta zone */}
      <div className="space-y-1.5 pt-2">
        <Button
          variant="ghost"
          className="w-full justify-center text-text-muted"
          onClick={forceUpdate}
        >
          <RefreshCw size={16} />
          Actualizar app
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-center text-danger hover:bg-danger/10"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesión"
        description="Vas a salir de tu cuenta. Tus datos no se pierden."
        confirmLabel="Salir"
        variant="danger"
      />

      {/* Achievement detail modal */}
      <AchievementModal
        selectedAchievement={selectedAchievement}
        unlockedAchievements={unlockedAchievements}
        evalCtx={evalCtx}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}

// --- Achievement Detail Modal ---

function AchievementModal({
  selectedAchievement,
  unlockedAchievements,
  evalCtx,
  onClose,
}: {
  selectedAchievement: AchievementDef | null;
  unlockedAchievements: import('../types/shared').Achievement[];
  evalCtx: ReturnType<typeof import('../hooks/useAchievements').useAchievements>['evalCtx'];
  onClose: () => void;
}) {
  const isUnlocked = selectedAchievement
    ? unlockedAchievements.some((a) => a.achievementId === selectedAchievement.id)
    : false;
  const progress = selectedAchievement
    ? getProgress(selectedAchievement.condition, evalCtx)
    : null;

  return (
    <Dialog
      open={!!selectedAchievement}
      onClose={onClose}
      title={
        selectedAchievement
          ? isUnlocked
            ? selectedAchievement.name
            : 'Logro bloqueado'
          : ''
      }
      size="sm"
      footer={
        <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      }
    >
      {selectedAchievement && (
        <div className="py-2 text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl ring-1',
              isUnlocked
                ? 'bg-gradient-to-br from-primary-soft to-accent-soft ring-primary/30'
                : 'bg-surface-light ring-border/60',
            )}
          >
            <span
              className={cn('text-5xl', !isUnlocked && 'grayscale opacity-50')}
              aria-hidden="true"
            >
              {isUnlocked ? selectedAchievement.icon : '?'}
            </span>
          </div>

          <div className="mb-3 flex justify-center">
            <Badge variant={selectedAchievement.type === 'couple' ? 'accent' : 'default'}>
              {selectedAchievement.type === 'couple' ? 'Pareja' : 'Individual'}
            </Badge>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-text-secondary">
            {selectedAchievement.description}
          </p>

          {isUnlocked ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
              <Trophy size={14} />
              Desbloqueado
            </div>
          ) : progress !== null ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-2xs uppercase tracking-wide text-text-muted">
                  Progreso
                </span>
                <span className="text-xs font-semibold tabular-nums text-text-primary">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-light">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(progress * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Bloqueado</p>
          )}
        </div>
      )}
    </Dialog>
  );
}
