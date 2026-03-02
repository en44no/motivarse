import { Card } from '../ui/Card';

interface PartnerComparisonProps {
  myPercent: number;
  partnerPercent: number;
  partnerName: string;
}

function getMessage(myPercent: number, partnerPercent: number, partnerName: string) {
  const diff = myPercent - partnerPercent;
  if (myPercent === 0 && partnerPercent === 0) return 'Arranquen la semana juntos 💪';
  if (diff > 20) return `Vas volando! Motivá a ${partnerName} 🚀`;
  if (diff > 0) return 'Vas adelante, seguí así! 💪';
  if (diff === 0) return 'Van parejos, gran equipo! 🤝';
  if (diff > -20) return `${partnerName} va un poco adelante 👀`;
  return `${partnerName} te lleva ventaja, a ponerse las pilas! 🔥`;
}

export function PartnerComparison({ myPercent, partnerPercent, partnerName }: PartnerComparisonProps) {
  const message = getMessage(myPercent, partnerPercent, partnerName);

  return (
    <Card>
      <h3 className="text-sm font-bold text-text-secondary mb-3">Comparativa semanal</h3>

      <div className="space-y-3">
        {/* My bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-primary">Yo</span>
            <span className="text-xs font-bold text-primary">{myPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-surface-light overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${myPercent}%` }}
            />
          </div>
        </div>

        {/* Partner bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-primary">{partnerName}</span>
            <span className="text-xs font-bold text-secondary">{partnerPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-surface-light overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-sky-400 transition-all duration-700 ease-out"
              style={{ width: `${partnerPercent}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-text-muted mt-3">{message}</p>
    </Card>
  );
}
