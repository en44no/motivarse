import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { usePWA } from '../../hooks/usePWA';
import { WifiOff } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buen día';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Header() {
  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { isOnline } = usePWA();

  const firstName = profile?.displayName?.split(' ')[0] || 'Usuario';

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <p className="text-xs text-text-muted">{getGreeting()}</p>
          <h1 className="text-lg font-bold text-text-primary">{firstName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 text-secondary text-xs">
              <WifiOff size={14} />
              <span>Offline</span>
            </div>
          )}
          {partnerName && (
            <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-text-secondary">{partnerName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
