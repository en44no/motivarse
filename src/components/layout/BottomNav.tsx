import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, Footprints, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '../../config/routes';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, icon: Home, label: 'Home' },
  { path: ROUTES.HABITS, icon: ListChecks, label: 'Hábitos' },
  { path: ROUTES.RUNNING, icon: Footprints, label: 'Correr' },
  { path: ROUTES.SHARED, icon: Heart, label: 'Nosotros' },
  { path: ROUTES.PROFILE, icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors',
                isActive ? 'text-primary' : 'text-text-muted'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
