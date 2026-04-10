import { Plus, Footprints, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const ACTIONS = [
  {
    icon: Plus,
    label: 'Nuevo hábito',
    route: ROUTES.HABITS,
  },
  {
    icon: Footprints,
    label: 'Correr',
    route: ROUTES.RUNNING,
  },
  {
    icon: ShoppingCart,
    label: 'Mandado',
    route: ROUTES.SHARED,
  },
] as const;

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2">
      {ACTIONS.map(({ icon: Icon, label, route }) => (
        <button
          key={label}
          type="button"
          onClick={() => navigate(route)}
          className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-surface p-4 text-text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-light">
            <Icon size={20} className="text-text-secondary" />
          </span>
          <span className="text-xs font-medium leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}
