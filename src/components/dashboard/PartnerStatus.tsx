import { Users } from 'lucide-react';
import { Card } from '../ui/Card';

interface PartnerStatusProps {
  partnerName: string;
  completedCount: number;
  totalCount: number;
}

export function PartnerStatus({ partnerName, completedCount, totalCount }: PartnerStatusProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="bg-gradient-to-r from-accent/5 to-transparent">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
          <Users size={20} className="text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">{partnerName}</p>
          <p className="text-xs text-text-muted">
            {completedCount}/{totalCount} hábitos hoy
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-accent">{progress}%</span>
        </div>
      </div>
      {/* Mini progress dots */}
      <div className="flex gap-1.5 mt-3">
        {Array.from({ length: totalCount }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i < completedCount ? 'bg-accent' : 'bg-surface-light'
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
