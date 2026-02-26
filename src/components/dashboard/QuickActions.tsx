import { Plus, Footprints, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: Plus, label: 'Nuevo hábito', color: 'bg-primary-soft text-primary', route: ROUTES.HABITS },
    { icon: Footprints, label: 'Registrar carrera', color: 'bg-secondary-soft text-secondary', route: ROUTES.RUNNING },
    { icon: ShoppingCart, label: 'Agregar mandado', color: 'bg-accent-soft text-accent', route: ROUTES.SHARED },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.route)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface border border-border hover:bg-surface-hover transition-all active:scale-95"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
            <action.icon size={20} />
          </div>
          <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
