import { useState } from 'react';
import { LogOut, Link, Download, User, Flame, Footprints, Trophy, Smartphone, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { useStreaks } from '../hooks/useStreaks';
import { useRunning } from '../hooks/useRunning';
import { useCoupleContext } from '../contexts/CoupleContext';
import { usePWA } from '../hooks/usePWA';
import { updateUserSettings } from '../services/user.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ACHIEVEMENT_DEFINITIONS } from '../config/constants';

export function ProfilePage() {
  const { profile, logout, linkPartner, error, isSubmitting } = useAuth();
  const { user } = useAuthContext();
  const { streaks } = useStreaks();
  const { progress } = useRunning();
  const { couple, partnerName } = useCoupleContext();
  const { canInstall, install, isInstalled } = usePWA();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

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

  const totalStreaks = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
  const bestStreak = streaks.reduce((best, s) => Math.max(best, s.longestStreak), 0);

  // Use profile.coupleId OR couple from CoupleContext (cached in localStorage)
  const hasPartner = !!profile?.coupleId || !!couple;
  // Only show "vincular pareja" when profile explicitly loaded without coupleId
  const profileLoaded = !!profile;

  return (
    <div className="space-y-4 py-4">
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
        <Card className="text-center bg-gradient-to-b from-secondary/5 to-transparent">
          <Flame size={20} className="mx-auto text-secondary mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{bestStreak}</p>
          <p className="text-[10px] text-text-muted">Mejor racha</p>
        </Card>
        <Card className="text-center bg-gradient-to-b from-primary/5 to-transparent">
          <Footprints size={20} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{progress?.totalRuns || 0}</p>
          <p className="text-[10px] text-text-muted">Carreras</p>
        </Card>
        <Card className="text-center bg-gradient-to-b from-accent/5 to-transparent">
          <Trophy size={20} className="mx-auto text-accent mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{totalStreaks}</p>
          <p className="text-[10px] text-text-muted">Racha total</p>
        </Card>
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
              <p className="text-xs text-text-muted">Ya tenés Motivarse en tu dispositivo</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sound toggle */}
      <Card variant="interactive" onClick={toggleSound}>
        <div className="flex items-center gap-3">
          {soundEnabled ? (
            <Volume2 size={20} className="text-primary" />
          ) : (
            <VolumeX size={20} className="text-text-muted" />
          )}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text-primary">Sonidos</h3>
            <p className="text-xs text-text-muted">
              {soundEnabled ? 'Activados' : 'Desactivados'}
            </p>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-primary' : 'bg-surface-light'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${soundEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </div>
        </div>
      </Card>

      {/* Achievements — collapsible */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-accent" />
            <div className="text-left">
              <p className="text-sm font-bold text-text-primary">Logros</p>
              <p className="text-xs text-text-muted">{ACHIEVEMENT_DEFINITIONS.length} logros por desbloquear</p>
            </div>
          </div>
          <ChevronDown
            size={18}
            className={`text-text-muted transition-transform duration-200 ${showAchievements ? 'rotate-180' : ''}`}
          />
        </button>

        {showAchievements && (
          <div className="border-t border-border divide-y divide-border/50">
            {ACHIEVEMENT_DEFINITIONS.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                <span className="text-xl">{achievement.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary">{achievement.name}</p>
                    <Badge variant={achievement.type === 'couple' ? 'accent' : 'default'}>
                      {achievement.type === 'couple' ? 'Pareja' : 'Individual'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{achievement.description}</p>
                </div>
                <span className="text-base text-text-muted shrink-0">🔒</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
