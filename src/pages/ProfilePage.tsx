import { useState } from 'react';
import { LogOut, Link, Download, User, Flame, Footprints, Trophy, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { useStreaks } from '../hooks/useStreaks';
import { useRunning } from '../hooks/useRunning';
import { useCoupleContext } from '../contexts/CoupleContext';
import { usePWA } from '../hooks/usePWA';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ProfilePage() {
  const { profile, logout, linkPartner, error, isSubmitting } = useAuth();
  const { user } = useAuthContext();
  const { streaks } = useStreaks();
  const { progress } = useRunning();
  const { couple, partnerName, loading: coupleLoading } = useCoupleContext();
  const { canInstall, install, isInstalled } = usePWA();
  const [partnerEmail, setPartnerEmail] = useState('');

  const totalStreaks = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
  const bestStreak = streaks.reduce((best, s) => Math.max(best, s.longestStreak), 0);

  return (
    <div className="space-y-4 py-4">
      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{profile?.displayName || user?.displayName || 'Usuario'}</h2>
            <p className="text-sm text-text-muted">{profile?.email}</p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <Flame size={20} className="mx-auto text-secondary mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{bestStreak}</p>
          <p className="text-[10px] text-text-muted">Mejor racha</p>
        </Card>
        <Card className="text-center">
          <Footprints size={20} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{progress?.totalRuns || 0}</p>
          <p className="text-[10px] text-text-muted">Carreras</p>
        </Card>
        <Card className="text-center">
          <Trophy size={20} className="mx-auto text-accent mb-1" />
          <p className="text-lg font-bold font-mono text-text-primary">{totalStreaks}</p>
          <p className="text-[10px] text-text-muted">Racha total</p>
        </Card>
      </div>

      {/* Partner linking */}
      {!coupleLoading && !couple && (
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

      {couple && (
        <Card>
          <div className="flex items-center gap-3">
            <Link size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Pareja vinculada</h3>
              <p className="text-xs text-text-muted">Con {partnerName}</p>
            </div>
            <span className="ml-auto text-primary text-xs font-semibold">Conectados ✓</span>
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

      {/* Logout */}
      <Button variant="ghost" className="w-full text-danger" onClick={logout}>
        <LogOut size={18} />
        Cerrar sesión
      </Button>
    </div>
  );
}
