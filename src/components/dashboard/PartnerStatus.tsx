import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Users, MessageCircleHeart, Check, Trash2, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { sendReaction, subscribeToReactions, type Reaction, type ReactionType } from '../../services/reactions.service';
import { markNoteRead, deleteNote } from '../../services/notes.service';
import { useNotes } from '../../hooks/useNotes';
import { getToday, formatRelativeTime } from '../../lib/date-utils';
import { cn } from '../../lib/utils';
import { ComposeNoteDialog } from './LoveNotesCard';
import type { LoveNote } from '../../types/notes';

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

export const PartnerStatus = memo(function PartnerStatus({ partnerName, completedCount, totalCount }: PartnerStatusProps) {
  const { user } = useAuthContext();
  const { couple, partnerId } = useCoupleContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [flyingEmoji, setFlyingEmoji] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [composingNote, setComposingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const notes = useNotes();

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;
  const today = getToday();

  // Subscribe to reactions
  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToReactions(coupleId, setReactions);
    return () => unsub();
  }, [coupleId]);

  // Received notes (for dialog)
  const receivedNotes = useMemo(
    () => notes.filter((n) => n.toUserId === userId),
    [notes, userId],
  );

  // Sent notes that partner hasn't read yet (badge for sender)
  const sentUnreadCount = useMemo(
    () => notes.filter((n) => n.fromUserId === userId && !n.read).length,
    [notes, userId],
  );

  // Which reactions have I already sent today?
  const sentToday = useMemo(
    () => new Set(
      reactions
        .filter((r) => r.fromUserId === userId && r.targetDate === today)
        .map((r) => r.type),
    ),
    [reactions, userId, today],
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

  const handleMarkRead = useCallback(async (noteId: string) => {
    await markNoteRead(noteId).catch(() => {});
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await deleteNote(noteId).catch(() => {});
  }, []);

  function handleNotaClick() {
    if (receivedNotes.length > 0) {
      setShowNotes(true);
    } else {
      setComposingNote(true);
    }
  }

  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Flying emoji animation */}
        <AnimatePresence>
          {flyingEmoji && (
            <motion.div
              key={flyingEmoji}
              className="pointer-events-none absolute z-10 text-3xl"
              initial={{ opacity: 1, y: 0, x: '50%', right: '50%' }}
              animate={{ opacity: 0, y: -80, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              style={{ bottom: '40px' }}
            >
              {flyingEmoji}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <Users size={20} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
              En pareja
            </p>
            <p className="mt-0.5 truncate text-base font-semibold text-text-primary">
              {partnerName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-2xl font-bold tabular-nums text-text-primary">
              {progress}
              <span className="text-base font-semibold text-text-muted">%</span>
            </span>
            <p className="text-2xs text-text-muted">
              {completedCount}/{totalCount} hoy
            </p>
          </div>
        </div>

        {/* Mini progress dots */}
        {totalCount > 0 && (
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: totalCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-200',
                  i < completedCount ? 'bg-accent' : 'bg-surface-light',
                )}
              />
            ))}
          </div>
        )}

        {/* Received reactions from partner */}
        {receivedToday.length > 0 && (
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Recibiste</span>
            <div className="flex gap-1">
              {receivedToday.map((r) => (
                <motion.span
                  key={r.id}
                  className="text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                >
                  {r.type}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Reaction buttons + Note button */}
        {partnerId && (
          <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
            <div className="flex flex-1 gap-1.5">
              {REACTION_EMOJIS.map(({ type, label }) => {
                const alreadySent = sentToday.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-label={label}
                    disabled={alreadySent || sending}
                    onClick={() => handleReaction(type)}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-colors duration-150',
                      alreadySent
                        ? 'cursor-not-allowed bg-surface-light opacity-40'
                        : 'bg-surface-light hover:bg-surface-hover active:scale-[0.94]',
                    )}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Note button with badge */}
            <button
              type="button"
              onClick={handleNotaClick}
              className="relative inline-flex h-11 items-center gap-1.5 rounded-xl bg-accent-soft px-3.5 text-accent transition-colors duration-150 hover:bg-accent/20 active:scale-[0.97]"
              aria-label="Enviar nota"
            >
              <MessageCircleHeart size={16} />
              <span className="text-xs font-semibold">Nota</span>
              {sentUnreadCount > 0 && (
                <Badge
                  variant="accent"
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] justify-center px-1 py-0 text-2xs"
                >
                  {sentUnreadCount}
                </Badge>
              )}
            </button>
          </div>
        )}
      </Card>

      {/* Notes list dialog */}
      <Dialog
        open={showNotes}
        onClose={() => setShowNotes(false)}
        title={`Notas de ${partnerName}`}
        subtitle={
          receivedNotes.length > 0
            ? `${receivedNotes.length} ${receivedNotes.length === 1 ? 'nota' : 'notas'}`
            : undefined
        }
        size="sm"
        footer={
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => {
              setShowNotes(false);
              setTimeout(() => setComposingNote(true), 200);
            }}
            className="w-full"
          >
            <PenLine size={16} />
            Escribir nota
          </Button>
        }
      >
        <div className="space-y-3">
          {receivedNotes.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-3">
                <MessageCircleHeart size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">No hay notas recibidas</p>
            </div>
          ) : (
            receivedNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 transition-colors',
                  note.read
                    ? 'border-border/60 bg-surface'
                    : 'border-primary/30 bg-primary-soft',
                )}
              >
                {note.emoji && (
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
                    {note.emoji}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary whitespace-pre-wrap break-words leading-relaxed">
                    {note.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-2xs text-text-muted">
                      {formatRelativeTime(note.createdAt)}
                    </span>
                    {!note.read && (
                      <Badge variant="primary" className="text-2xs py-0">
                        Nueva
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!note.read && (
                    <IconButton
                      aria-label="Marcar como leída"
                      variant="subtle"
                      size="md"
                      onClick={() => handleMarkRead(note.id)}
                      className="bg-primary-soft text-primary hover:bg-primary/20"
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label="Eliminar nota"
                    variant="danger"
                    size="md"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>

      <ComposeNoteDialog open={composingNote} onClose={() => setComposingNote(false)} />
    </>
  );
});
