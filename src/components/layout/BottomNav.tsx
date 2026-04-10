import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, Footprints, ShoppingCart, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '../../config/routes';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, icon: Home, label: 'Home' },
  { path: ROUTES.HABITS, icon: ListChecks, label: 'Hábitos' },
  { path: ROUTES.RUNNING, icon: Footprints, label: 'Correr' },
  { path: ROUTES.SHARED, icon: ShoppingCart, label: 'Mandados' },
  { path: ROUTES.EXPENSES, icon: Wallet, label: 'Gastos' },
  { path: ROUTES.PROFILE, icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)]" aria-label="Navegación principal">
      <div
        className="relative mx-auto max-w-lg rounded-2xl border border-white/[0.06] bg-surface/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          before:absolute before:inset-x-4 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent"
      >
        <ul className="flex items-center justify-around h-16" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5 w-14 min-h-[44px] transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-primary/10"
                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    />
                  )}
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
                  <span className={cn(
                    'text-2xs font-medium relative z-10 transition-opacity duration-200',
                    isActive ? 'opacity-100' : 'opacity-70'
                  )}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
