import { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, Mail, MailOpen, Pencil } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Dialog } from '../ui/Dialog';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import {
  sendNote,
  subscribeToNotes,
  markNoteRead,
  deleteNote,
} from '../../services/notes.service';
import { formatRelativeTime } from '../../lib/date-utils';
import { cn } from '../../lib/utils';
import type { LoveNote, NoteColor } from '../../types/notes';

const NOTE_COLOR_STYLES: Record<NoteColor, { bg: string; border: string; shadow: string }> = {
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-200/60 dark:border-amber-700/40',
    shadow: 'shadow-amber-200/30 dark:shadow-amber-900/20',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    border: 'border-pink-200/60 dark:border-pink-700/40',
    shadow: 'shadow-pink-200/30 dark:shadow-pink-900/20',
  },
  blue: {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    border: 'border-sky-200/60 dark:border-sky-700/40',
    shadow: 'shadow-sky-200/30 dark:shadow-sky-900/20',
  },
  green: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    border: 'border-emerald-200/60 dark:border-emerald-700/40',
    shadow: 'shadow-emerald-200/30 dark:shadow-emerald-900/20',
  },
  purple: {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    border: 'border-violet-200/60 dark:border-violet-700/40',
    shadow: 'shadow-violet-200/30 dark:shadow-violet-900/20',
  },
};

const ROTATIONS = [-2.5, 1.8, -1.2, 2.4, -0.8, 1.5, -1.8, 2.1];

const EMOJI_OPTIONS = ['💛', '📝', '✨', '🌸', '💌', '🦋'];

function getRotation(index: number): number {
  return ROTATIONS[index % ROTATIONS.length];
}

/* ─── Swipeable Post-it ─── */

function PostItNote({
  note,
  fromName,
  isMine,
  rotation,
  onMarkRead,
  onDelete,
}: {
  note: LoveNote;
  fromName: string;
  isMine: boolean;
  rotation: number;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const colors = NOTE_COLOR_STYLES[note.color];
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-danger flex items-center justify-end pr-5 rounded-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-white">
          <span className="text-xs font-semibold">Eliminar</span>
        </motion.div>
      </motion.div>

      {/* Post-it card */}
      <motion.div
        className={cn(
          'relative rounded-xl border p-3.5 transition-colors',
          colors.bg,
          colors.border,
          'shadow-md',
          colors.shadow,
        )}
        style={{
          x,
          rotate: rotation,
          transformOrigin: 'center center',
        }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            onDelete(note.id);
          }
        }}
        onClick={() => {
          if (!note.read && !isMine) onMarkRead(note.id);
        }}
        whileHover={{ rotate: 0, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Tape effect at top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/40 dark:bg-white/10 rounded-sm rotate-[-1deg]" />

        {/* Unread indicator */}
        {!note.read && !isMine && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
        )}

        {/* Emoji */}
        {note.emoji && (
          <span className="text-lg leading-none mb-1 block">{note.emoji}</span>
        )}

        {/* Text */}
        <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
          {note.text}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            {isMine ? 'Tú' : `De ${fromName}`}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatRelativeTime(note.createdAt)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Compose Dialog Content ─── */

function ComposeNote({
  partnerName,
  onSend,
  onClose,
}: {
  partnerName: string;
  onSend: (text: string, emoji?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed, emoji);
      onClose();
      toast.success(`Nota enviada a ${partnerName} 💌`);
    } catch {
      toast.error('No se pudo enviar la nota');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full rounded-xl bg-surface-light border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        placeholder={`Escribile algo lindo a ${partnerName}...`}
        rows={3}
        maxLength={200}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{text.length}/200</span>
      </div>

      {/* Emoji selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Emoji:</span>
        <div className="flex gap-1.5">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(emoji === e ? undefined : e)}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all',
                emoji === e
                  ? 'bg-primary-soft ring-2 ring-primary/40 scale-110'
                  : 'bg-surface-light hover:bg-surface-hover active:scale-95',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Send button */}
      <button
        type="button"
        disabled={!text.trim() || sending}
        onClick={handleSend}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
          text.trim()
            ? 'bg-primary text-white hover:brightness-110 active:scale-[0.98]'
            : 'bg-surface-light text-text-muted cursor-not-allowed',
        )}
      >
        <Send size={16} />
        {sending ? 'Enviando...' : 'Enviar nota'}
      </button>
    </div>
  );
}

/* ─── Main Card ─── */

export function LoveNotesCard() {
  const { user } = useAuthContext();
  const { couple, partnerId, partnerName } = useCoupleContext();
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [composing, setComposing] = useState(false);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;

  // Subscribe to notes
  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToNotes(coupleId, setNotes);
    return () => unsub();
  }, [coupleId]);

  // Split received vs sent
  const receivedNotes = useMemo(
    () => notes.filter((n) => n.toUserId === userId),
    [notes, userId],
  );
  const sentNotes = useMemo(
    () => notes.filter((n) => n.fromUserId === userId),
    [notes, userId],
  );
  const unreadCount = useMemo(
    () => receivedNotes.filter((n) => !n.read).length,
    [receivedNotes],
  );

  // All notes for display, interleaved: received first, then sent
  const allNotes = useMemo(() => {
    return [...receivedNotes, ...sentNotes];
  }, [receivedNotes, sentNotes]);

  const handleSend = useCallback(
    async (text: string, emoji?: string) => {
      if (!coupleId || !userId || !partnerId) return;
      await sendNote(coupleId, userId, partnerId, text, emoji);
    },
    [coupleId, userId, partnerId],
  );

  const handleMarkRead = useCallback(async (noteId: string) => {
    await markNoteRead(noteId).catch(() => {});
  }, []);

  const handleDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId).catch(() => {});
  }, []);

  if (!coupleId || !partnerId) return null;

  return (
    <>
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              {unreadCount > 0 ? (
                <Mail size={20} className="text-pink-500" />
              ) : (
                <MailOpen size={20} className="text-pink-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">Notitas</p>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {allNotes.length === 0
                  ? `Enviá una nota a ${partnerName}`
                  : `${allNotes.length} ${allNotes.length === 1 ? 'nota' : 'notas'}`}
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => setComposing(true)}
            className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-500 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
            whileTap={{ scale: 0.9 }}
            aria-label="Escribir nota"
          >
            <Pencil size={18} />
          </motion.button>
        </div>

        {/* Notes list */}
        {allNotes.length > 0 && (
          <div className="space-y-2.5 mt-1">
            <AnimatePresence mode="popLayout">
              {allNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -200, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.03 }}
                >
                  <PostItNote
                    note={note}
                    fromName={note.fromUserId === userId ? 'Tú' : partnerName}
                    isMine={note.fromUserId === userId}
                    rotation={getRotation(i)}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {allNotes.length === 0 && (
          <motion.div
            className="flex flex-col items-center py-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-4xl mb-2">💌</span>
            <p className="text-sm text-text-muted">
              Dejale un post-it a {partnerName}
            </p>
          </motion.div>
        )}
      </Card>

      {/* Compose dialog */}
      <Dialog open={composing} onClose={() => setComposing(false)} title="Nueva nota">
        <ComposeNote
          partnerName={partnerName}
          onSend={handleSend}
          onClose={() => setComposing(false)}
        />
      </Dialog>
    </>
  );
}
