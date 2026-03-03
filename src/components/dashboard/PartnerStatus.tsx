import { useState, useEffect, useCallback } from 'react';
import { Users, MessageCircleHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { sendReaction, subscribeToReactions, type Reaction, type ReactionType } from '../../services/reactions.service';
import { getToday } from '../../lib/date-utils';
import { ComposeNoteDialog } from './LoveNotesCard';

interface PartnerStatusProps {
  partnerName: string;
  completedCount: number;
  totalCount: number;
}

const REACTION_EMOJIS: { type: ReactionType; label: string }[] = [
  { type: '🔥', label: 'Fuego' },
  { type: '👏', label: 'Aplauso' },
  { type: '❤️', label: 'Corazón' },
  { type: '💪', label: 'Fuerza' },
];

export function PartnerStatus({ partnerName, completedCount, totalCount }: PartnerStatusProps) {
  const { user } = useAuthContext();
  const { couple, partnerId } = useCoupleContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [flyingEmoji, setFlyingEmoji] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [composingNote, setComposingNote] = useState(false);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;
  const today = getToday();

  // Subscribe to reactions
  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToReactions(coupleId, setReactions);
    return () => unsub();
  }, [coupleId]);

  // Which reactions have I already sent today?
  const sentToday = new Set(
    reactions
      .filter((r) => r.fromUserId === userId && r.targetDate === today)
      .map((r) => r.type),
  );

  // Reactions received from partner today
  const receivedToday = reactions.filter(
    (r) => r.toUserId === userId && r.targetDate === today,
  );

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      if (!coupleId || !userId || !partnerId || sending) return;
      if (sentToday.has(type)) return;

      setSending(true);
      setFlyingEmoji(type);

      try {
        await sendReaction(coupleId, userId, partnerId, type, 'habit', today);
        toast.success(`${type} enviado a ${partnerName}`);
      } catch (error) {
        toast.error('No se pudo enviar la reacción');
      } finally {
        setSending(false);
        setTimeout(() => setFlyingEmoji(null), 800);
      }
    },
    [coupleId, userId, partnerId, sending, sentToday, today, partnerName],
  );

  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <Card className="bg-gradient-to-r from-accent/5 to-transparent relative overflow-hidden">
        {/* Flying emoji animation */}
        <AnimatePresence>
          {flyingEmoji && (
            <motion.div
              key={flyingEmoji}
              className="absolute text-3xl pointer-events-none z-10"
              initial={{ opacity: 1, y: 0, x: '50%', right: '50%' }}
              animate={{ opacity: 0, y: -80, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ bottom: '40px' }}
            >
              {flyingEmoji}
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Received reactions from partner */}
        {receivedToday.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            <span className="text-xs text-text-muted mr-1">Recibiste:</span>
            {receivedToday.map((r) => (
              <motion.span
                key={r.id}
                className="text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.4 }}
              >
                {r.type}
              </motion.span>
            ))}
          </div>
        )}

        {/* Reaction buttons + Note button */}
        {partnerId && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-text-muted">Reaccionar:</span>
            <div className="flex gap-1.5 flex-1">
              {REACTION_EMOJIS.map(({ type, label }) => {
                const alreadySent = sentToday.has(type);
                return (
                  <motion.button
                    key={type}
                    aria-label={label}
                    disabled={alreadySent || sending}
                    onClick={() => handleReaction(type)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                      alreadySent
                        ? 'bg-surface-light opacity-40 cursor-not-allowed'
                        : 'bg-surface-light hover:bg-primary-soft hover:scale-110 active:scale-95'
                    }`}
                    whileTap={!alreadySent ? { scale: 0.85 } : undefined}
                  >
                    {type}
                  </motion.button>
                );
              })}
            </div>

            {/* Note button */}
            <motion.button
              onClick={() => setComposingNote(true)}
              className="h-9 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 flex items-center gap-1.5 transition-colors"
              whileTap={{ scale: 0.9 }}
              aria-label="Enviar nota"
            >
              <MessageCircleHeart size={16} className="text-pink-400" />
              <span className="text-xs font-semibold text-pink-400">Nota</span>
            </motion.button>
          </div>
        )}
      </Card>

      <ComposeNoteDialog open={composingNote} onClose={() => setComposingNote(false)} />
    </>
  );
}
