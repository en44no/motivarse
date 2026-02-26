import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useSharedTodos } from '../hooks/useSharedTodos';
import { Tabs } from '../components/ui/Tabs';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TodoList } from '../components/shared/TodoList';
import { TodoForm } from '../components/shared/TodoForm';
import { ACHIEVEMENT_DEFINITIONS } from '../config/constants';

const TABS = [
  { id: 'todos', label: 'Mandados' },
  { id: 'achievements', label: 'Logros' },
];

export function SharedPage() {
  const [activeTab, setActiveTab] = useState('todos');
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, completed, loading, add, toggle, remove } = useSharedTodos();

  const memberNames = couple?.memberNames || {};

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'todos' && (
        <div className="space-y-4">
          <TodoForm onSubmit={(title, priority) => add(title, priority)} />

          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                Pendientes ({pending.length})
              </h3>
              <TodoList
                todos={pending}
                onToggle={toggle}
                onDelete={remove}
                currentUserId={user?.uid || ''}
                memberNames={memberNames}
              />
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                Completados ({completed.length})
              </h3>
              <TodoList
                todos={completed}
                onToggle={toggle}
                onDelete={remove}
                currentUserId={user?.uid || ''}
                memberNames={memberNames}
              />
            </div>
          )}

          {pending.length === 0 && completed.length === 0 && (
            <EmptyState
              icon={<Trophy size={40} />}
              title="Sin mandados"
              description="Agregá mandados compartidos con tu pareja"
            />
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Desbloqueen logros completando hábitos juntos.
          </p>
          {ACHIEVEMENT_DEFINITIONS.map((achievement) => (
            <Card key={achievement.id} className="opacity-50 grayscale">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">{achievement.name}</h3>
                    <Badge variant={achievement.type === 'couple' ? 'accent' : 'default'}>
                      {achievement.type === 'couple' ? 'Pareja' : 'Individual'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{achievement.description}</p>
                </div>
                <span className="text-lg text-text-muted">🔒</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
