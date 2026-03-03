import { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'sonner';
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

/* ─── Color palette for post-its ─── */

const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: 'rgba(251, 191, 36, 0.18)',
  pink: 'rgba(244, 114, 182, 0.18)',
  blue: 'rgba(56, 189, 248, 0.18)',
  green: 'rgba(74, 222, 128, 0.18)',
  purple: 'rgba(167, 139, 250, 0.18)',
};

const NOTE_ACCENTS: Record<NoteColor, string> = {
  yellow: 'rgba(251, 191, 36, 0.5)',
  pink: 'rgba(244, 114, 182, 0.5)',
  blue: 'rgba(56, 189, 248, 0.5)',
  green: 'rgba(74, 222, 128, 0.5)',
  purple: 'rgba(167, 139, 250, 0.5)',
};

const TAPE_COLORS: Record<NoteColor, string> = {
  yellow: 'rgba(251, 191, 36, 0.25)',
  pink: 'rgba(244, 114, 182, 0.25)',
  blue: 'rgba(56, 189, 248, 0.25)',
  green: 'rgba(74, 222, 128, 0.25)',
  purple: 'rgba(167, 139, 250, 0.25)',
};

const ROTATIONS = [-1.8, 2.2, -0.7, 1.5, -2.4, 0.9, -1.3, 2.6];

function getRotation(index: number): number {
  return ROTATIONS[index % ROTATIONS.length];
}

/* ─── Default emoji presets ─── */

const DEFAULT_EMOJIS = ['😘', '❤️', '💕', '🥰', '💋', '✨', '🌹', '💌'];

/* ─── Single floating post-it ─── */

function FloatingPostIt({
  note,
  fromName,
  index,
  onMarkRead,
  onDelete,
}: {
  note: LoveNote;
  fromName: string;
  index: number;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rotation = getRotation(index);
  const bgColor = NOTE_COLORS[note.color];
  const accentColor = NOTE_ACCENTS[note.color];
  const tapeColor = TAPE_COLORS[note.color];
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: -20, rotate: rotation * 2 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.5, y: -30, rotate: rotation * 3 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22, delay: index * 0.05 }}
      className="relative"
    >
      {/* Swipe delete bg */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-danger/80 flex items-center justify-end pr-4"
        style={{ opacity: deleteOpacity }}
      >
        <span className="text-white text-xs font-bold">Borrar</span>
      </motion.div>

      <motion.div
        className="relative rounded-2xl p-4 pb-3 cursor-default"
        style={{
          x,
          background: bgColor,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid ${accentColor}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete(note.id);
        }}
        onClick={() => {
          if (!note.read) onMarkRead(note.id);
        }}
      >
        {/* Decorative tape strip */}
        <div
          className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-12 h-[10px] rounded-sm"
          style={{
            background: tapeColor,
            transform: `translateX(-50%) rotate(${rotation > 0 ? -1 : 1}deg)`,
          }}
        />

        {/* Unread shimmer */}
        {!note.read && (
          <div className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}

        {/* Content */}
        <div className="flex gap-2.5 items-start">
          {note.emoji && (
            <span className="text-xl leading-none mt-0.5 shrink-0">{note.emoji}</span>
          )}
          <p className="text-[13px] leading-[1.5] text-text-primary whitespace-pre-wrap break-words flex-1 min-w-0">
            {note.text}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t"
          style={{ borderColor: accentColor }}
        >
          <span className="text-[11px] text-text-muted font-medium italic">
            — {fromName}
          </span>
          <span className="text-[10px] text-text-muted/70">
            {formatRelativeTime(note.createdAt)}
          </span>
        </div>

        {/* Close / dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <X size={10} className="text-text-muted" />
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Compose Dialog ─── */

export function ComposeNoteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthContext();
  const { couple, partnerId, partnerName } = useCoupleContext();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [customEmoji, setCustomEmoji] = useState('');
  const [sending, setSending] = useState(false);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;

  // Reset on close
  useEffect(() => {
    if (!open) {
      setText('');
      setEmoji(undefined);
      setCustomEmoji('');
    }
  }, [open]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !coupleId || !userId || !partnerId) return;
    setSending(true);
    try {
      const finalEmoji = customEmoji.trim() || emoji;
      await sendNote(coupleId, userId, partnerId, trimmed, finalEmoji);
      onClose();
      toast.success(`Nota enviada a ${partnerName} 💌`);
    } catch {
      toast.error('No se pudo enviar la nota');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nota de amor 💌">
      <div className="space-y-4">
        {/* Textarea — NO autoFocus */}
        <textarea
          className="w-full rounded-xl bg-surface-light border border-border p-3.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          placeholder={`Escribile algo lindo a ${partnerName}...`}
          rows={3}
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Char counter */}
        <div className="flex justify-end -mt-2">
          <span className="text-[11px] text-text-muted">{text.length}/200</span>
        </div>

        {/* Emoji presets */}
        <div>
          <span className="text-xs text-text-muted mb-2 block">Emoji (opcional)</span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setEmoji(emoji === e ? undefined : e);
                  setCustomEmoji('');
                }}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                  emoji === e && !customEmoji
                    ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
                    : 'bg-surface-light hover:bg-surface-hover active:scale-90',
                )}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Custom emoji input */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[11px] text-text-muted">o escribí uno:</span>
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => {
                setCustomEmoji(e.target.value.slice(0, 2));
                if (e.target.value) setEmoji(undefined);
              }}
              placeholder="🎀"
              className="w-14 text-center rounded-lg bg-surface-light border border-border p-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Send */}
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
    </Dialog>
  );
}

/* ─── Floating notes display (above TodaySummary) ─── */

export function FloatingLoveNotes() {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const [notes, setNotes] = useState<LoveNote[]>([]);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;

  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToNotes(coupleId, setNotes);
    return () => unsub();
  }, [coupleId]);

  // Only show notes TO me (received), newest first
  const receivedNotes = useMemo(
    () => notes.filter((n) => n.toUserId === userId),
    [notes, userId],
  );

  const handleMarkRead = useCallback(async (noteId: string) => {
    await markNoteRead(noteId).catch(() => {});
  }, []);

  const handleDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId).catch(() => {});
  }, []);

  if (!coupleId || receivedNotes.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {receivedNotes.map((note, i) => (
          <FloatingPostIt
            key={note.id}
            note={note}
            fromName={partnerName}
            index={i}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
