import { useState, useMemo, useEffect } from 'react';
import { LogOut, Link, Download, User, Flame, Footprints, Trophy, Smartphone, Volume2, VolumeX, ChevronDown, Bell, BellOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { useStreaks } from '../hooks/useStreaks';
import { useRunning } from '../hooks/useRunning';
import { useAchievements, getProgress } from '../hooks/useAchievements';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePWA } from '../hooks/usePWA';
import { updateUserSettings } from '../services/user.service';
import { requestPushPermission, disablePushNotifications } from '../lib/notifications';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SettingToggle } from '../components/ui/SettingToggle';
import { ThemeSelector } from '../components/profile/ThemeSelector';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORY_LABELS } from '../config/constants';
import type { AchievementDef, AchievementCategory } from '../types/shared';

export function ProfilePage() {
  const { profile, logout, linkPartner, error, isSubmitting } = useAuth();
  const { user } = useAuthContext();
  const { streaks } = useStreaks();
  const { progress } = useRunning();
  const { couple, partnerName } = useCoupleContext();
  const { canInstall, install, isInstalled } = usePWA();
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
      if (!success) toast.error('No se pudo activar las notificaciones. Revisá los permisos del navegador.');
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
  // Only show "vincular pareja" when profile explicitly loaded without coupleId
  const profileLoaded = !!profile;

  return (
    <div className="space-y-4 py-4">
      <h1 className="sr-only">Perfil</h1>
      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
            <User size={30} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{profile?.displayName || user?.displayName || 'Usuario'}</h2>
            <p className="text-sm text-text-muted">{profile?.email || user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Flame size={20} className="mx-auto text-secondary mb-1" />, value: bestStreak, label: 'Mejor racha', bg: 'from-secondary/5' },
          { icon: <Footprints size={20} className="mx-auto text-primary mb-1" />, value: progress?.totalRuns || 0, label: 'Carreras', bg: 'from-primary/5' },
          { icon: <Trophy size={20} className="mx-auto text-accent mb-1" />, value: totalStreaks, label: 'Racha total', bg: 'from-accent/5' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <Card className={`text-center bg-gradient-to-b ${stat.bg} to-transparent`}>
              {stat.icon}
              <p className="text-lg font-bold font-mono text-text-primary">{stat.value}</p>
              <p className="text-[10px] text-text-muted">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Partner linking — only show "vincular" when profile loaded and no couple */}
      {profileLoaded && !hasPartner && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Link size={20} className="text-accent" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Vincular pareja</h3>
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
        </Card>
      )}

      {hasPartner && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <Link size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Pareja vinculada</h3>
              <p className="text-xs text-text-muted">Con {partnerName || 'tu pareja'}</p>
            </div>
            <span className="ml-auto text-primary text-xs font-semibold">Conectados</span>
          </div>
        </Card>
      )}

      {/* Install PWA */}
      {canInstall && !isInstalled && (
        <Card variant="interactive" onClick={install}>
          <div className="flex items-center gap-3">
            <Download size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Instalar app</h3>
              <p className="text-xs text-text-muted">Agregala a tu pantalla de inicio</p>
            </div>
          </div>
        </Card>
      )}

      {isInstalled && (
        <Card>
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">App instalada</h3>
              <p className="text-xs text-text-muted">Ya tenés Gestionarse en tu dispositivo</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sound toggle */}
      <SettingToggle
        icon={<Volume2 size={20} className="text-primary" />}
        iconOff={<VolumeX size={20} className="text-text-muted" />}
        title="Sonidos"
        description={soundEnabled ? 'Activados' : 'Desactivados'}
        enabled={soundEnabled}
        onToggle={toggleSound}
      />

      {/* Notifications toggle */}
      <SettingToggle
        icon={<Bell size={20} className="text-primary" />}
        iconOff={<BellOff size={20} className="text-text-muted" />}
        title="Notificaciones"
        description={notificationsEnabled ? 'Activadas — recordatorio diario a las 22:00' : 'Desactivadas'}
        enabled={notificationsEnabled}
        onToggle={toggleNotifications}
      />

      {/* Achievements — collapsible */}
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

      {/* Force update */}
      <Button variant="ghost" className="w-full text-text-muted" onClick={forceUpdate}>
        <RefreshCw size={18} />
        Actualizar app
      </Button>

      {/* Logout */}
      <Button variant="ghost" className="w-full text-danger" onClick={handleLogout}>
        <LogOut size={18} />
        Cerrar sesion
      </Button>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesion"
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

// --- Achievements Section Component ---

interface AchievementsSectionProps {
  showAchievements: boolean;
  setShowAchievements: (v: boolean) => void;
  unlockedAchievements: import('../types/shared').Achievement[];
  evalCtx: ReturnType<typeof import('../hooks/useAchievements').useAchievements>['evalCtx'];
  selectedAchievement: AchievementDef | null;
  setSelectedAchievement: (v: AchievementDef | null) => void;
}

function AchievementsSection({
  showAchievements,
  setShowAchievements,
  unlockedAchievements,
  evalCtx,
  setSelectedAchievement,
}: AchievementsSectionProps) {
  const unlockedIds = useMemo(
    () => new Set(unlockedAchievements.map((a) => a.achievementId)),
    [unlockedAchievements]
  );
  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementDef[]>();
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const list = map.get(def.category) || [];
      list.push(def);
      map.set(def.category, list);
    }
    return map;
  }, []);

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden" role="region" aria-label="Logros">
      <button
        onClick={() => setShowAchievements(!showAchievements)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy size={20} className="text-accent" />
          <div className="text-left">
            <p className="text-sm font-bold text-text-primary">Logros</p>
            <p className="text-xs text-text-muted">
              {unlockedCount}/{totalCount} desbloqueados
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            'text-text-muted transition-transform duration-200',
            showAchievements && 'rotate-180'
          )}
        />
      </button>

      {showAchievements && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Grid by category */}
          {Array.from(grouped.entries()).map(([category, defs]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {ACHIEVEMENT_CATEGORY_LABELS[category] || category}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {defs.map((def) => {
                  const isUnlocked = unlockedIds.has(def.id);
                  const progress = getProgress(def.condition, evalCtx);
                  return (
                    <button
                      key={def.id}
                      onClick={() => setSelectedAchievement(def)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                        isUnlocked
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'bg-surface-light/50 hover:bg-surface-light opacity-60'
                      )}
                    >
                      <span className={cn('text-2xl', !isUnlocked && 'grayscale')}>
                        {isUnlocked ? def.icon : '?'}
                      </span>
                      <span className="text-[10px] font-medium text-text-primary leading-tight text-center line-clamp-2">
                        {isUnlocked ? def.name : '???'}
                      </span>
                      {!isUnlocked && progress !== null && progress > 0 && (
                        <div className="w-full h-1 bg-surface-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/50 rounded-full"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
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
  useEffect(() => {
    if (!selectedAchievement) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAchievement, onClose]);

  return (
    <AnimatePresence>
      {selectedAchievement && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative bg-surface rounded-2xl border border-border shadow-xl p-6 max-w-[300px] w-full text-center"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const isUnlocked = unlockedAchievements.some(
                (a) => a.achievementId === selectedAchievement.id
              );
              const progress = getProgress(selectedAchievement.condition, evalCtx);
              return (
                <>
                  <span className={cn('text-5xl block mb-3', !isUnlocked && 'grayscale opacity-50')}>
                    {isUnlocked ? selectedAchievement.icon : '?'}
                  </span>
                  <p id="achievement-title" className="text-lg font-bold text-text-primary mb-1">
                    {selectedAchievement.name}
                  </p>
                  <Badge variant={selectedAchievement.type === 'couple' ? 'accent' : 'default'} className="mb-2">
                    {selectedAchievement.type === 'couple' ? 'Pareja' : 'Individual'}
                  </Badge>
                  <p className="text-sm text-text-muted mb-3">
                    {selectedAchievement.description}
                  </p>
                  {isUnlocked ? (
                    <p className="text-xs text-primary font-semibold">Desbloqueado</p>
                  ) : progress !== null ? (
                    <div>
                      <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-muted">
                        {Math.round(progress * 100)}% completado
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">Bloqueado</p>
                  )}
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
