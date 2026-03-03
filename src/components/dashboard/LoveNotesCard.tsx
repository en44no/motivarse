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

/* ─── Real post-it colors: solid, warm, paper-like ─── */

const POSTIT_BG: Record<NoteColor, string> = {
  yellow: '#fef3c7',
  pink: '#fce7f3',
  blue: '#dbeafe',
  green: '#dcfce7',
  purple: '#ede9fe',
};

const POSTIT_FOLD: Record<NoteColor, string> = {
  yellow: '#fcd34d',
  pink: '#f9a8d4',
  blue: '#93c5fd',
  green: '#86efac',
  purple: '#c4b5fd',
};

const POSTIT_TEXT: Record<NoteColor, string> = {
  yellow: '#78350f',
  pink: '#831843',
  blue: '#1e3a5f',
  green: '#14532d',
  purple: '#3b0764',
};

const POSTIT_SUB: Record<NoteColor, string> = {
  yellow: '#92400e',
  pink: '#9d174d',
  blue: '#1e40af',
  green: '#166534',
  purple: '#5b21b6',
};

const ROTATIONS = [-2.2, 1.6, -0.9, 2.8, -1.5, 0.6, -2.8, 1.2];

function getRotation(index: number): number {
  return ROTATIONS[index % ROTATIONS.length];
}

const DEFAULT_EMOJIS = ['😘', '❤️', '💕', '🥰', '💋', '✨', '🌹', '💌'];

/* ─── Single Post-it Note ─── */

function PostIt({
  note,
  label,
  index,
  onDelete,
  onMarkRead,
}: {
  note: LoveNote;
  label: string;
  index: number;
  onDelete: (id: string) => void;
  onMarkRead?: (id: string) => void;
}) {
  const rotation = getRotation(index);
  const bg = POSTIT_BG[note.color];
  const fold = POSTIT_FOLD[note.color];
  const textColor = POSTIT_TEXT[note.color];
  const subColor = POSTIT_SUB[note.color];
  const x = useMotionValue(0);
  const swipeOpacity = useTransform(x, [-100, -50], [1, 0]);

  const FOLD_SIZE = 18;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, rotate: rotation * 2 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.6, x: -150, rotate: rotation * 3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: index * 0.06 }}
      className="relative"
    >
      {/* Swipe delete background */}
      <motion.div
        className="absolute inset-0 rounded-md bg-red-500 flex items-center justify-end pr-5"
        style={{ opacity: swipeOpacity }}
      >
        <span className="text-white text-xs font-bold">Borrar</span>
      </motion.div>

      <motion.div
        className="relative cursor-default"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete(note.id);
        }}
        onClick={() => {
          if (onMarkRead && !note.read) onMarkRead(note.id);
        }}
        whileHover={{ rotate: 0, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Main paper body */}
        <div
          className="relative rounded-[3px] px-4 pt-5 pb-3.5"
          style={{
            background: bg,
            boxShadow: `
              2px 3px 8px rgba(0,0,0,0.12),
              1px 1px 2px rgba(0,0,0,0.08),
              inset 0 1px 0 rgba(255,255,255,0.5),
              inset 0 -1px 0 rgba(0,0,0,0.04)
            `,
            /* Subtle paper grain via noise-like gradient */
            backgroundImage: `
              linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%),
              linear-gradient(${bg}, ${bg})
            `,
          }}
        >
          {/* Folded corner triangle — bottom-right */}
          <div
            className="absolute bottom-0 right-0 overflow-hidden"
            style={{ width: FOLD_SIZE, height: FOLD_SIZE }}
          >
            {/* The fold: a triangle that reveals a darker shade */}
            <div
              className="absolute bottom-0 right-0"
              style={{
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: `0 0 ${FOLD_SIZE}px ${FOLD_SIZE}px`,
                borderColor: `transparent transparent var(--color-background) transparent`,
              }}
            />
            <div
              className="absolute bottom-0 right-0"
              style={{
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: `${FOLD_SIZE}px ${FOLD_SIZE}px 0 0`,
                borderColor: `${fold} transparent transparent transparent`,
                filter: 'brightness(0.85)',
              }}
            />
          </div>

          {/* Pin / tape at top-center */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-sm opacity-60"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.2))`,
              backdropFilter: 'blur(2px)',
              border: '0.5px solid rgba(255,255,255,0.3)',
            }}
          />

          {/* Unread dot */}
          {!note.read && onMarkRead && (
            <div
              className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: subColor }}
            />
          )}

          {/* Delete X */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity"
            style={{ color: textColor }}
          >
            <X size={11} />
          </button>

          {/* Content */}
          <div className="flex gap-2 items-start">
            {note.emoji && (
              <span className="text-xl leading-none mt-0.5 shrink-0 drop-shadow-sm">{note.emoji}</span>
            )}
            <p
              className="text-[13.5px] leading-[1.55] whitespace-pre-wrap break-words flex-1 min-w-0"
              style={{
                color: textColor,
                fontStyle: 'italic',
              }}
            >
              {note.text}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-1.5"
            style={{ borderTop: `1px dashed ${fold}` }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: subColor }}
            >
              {label}
            </span>
            <span
              className="text-[10px] opacity-60"
              style={{ color: subColor }}
            >
              {formatRelativeTime(note.createdAt)}
            </span>
          </div>
        </div>
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
        <textarea
          className="w-full rounded-xl bg-surface-light border border-border p-3.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          placeholder={`Escribile algo lindo a ${partnerName}...`}
          rows={3}
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex justify-end -mt-2">
          <span className="text-[11px] text-text-muted">{text.length}/200</span>
        </div>

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

/* ─── Floating notes (above TodaySummary) ─── */

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

  // Received notes (from partner to me)
  const receivedNotes = useMemo(
    () => notes.filter((n) => n.toUserId === userId),
    [notes, userId],
  );

  // Sent notes that partner hasn't read yet (I can still delete them)
  const sentUnread = useMemo(
    () => notes.filter((n) => n.fromUserId === userId && !n.read),
    [notes, userId],
  );

  const handleMarkRead = useCallback(async (noteId: string) => {
    await markNoteRead(noteId).catch(() => {});
  }, []);

  const handleDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId).catch(() => {});
  }, []);

  const hasNotes = receivedNotes.length > 0 || sentUnread.length > 0;

  if (!coupleId || !hasNotes) return null;

  return (
    <div className="space-y-3">
      {/* Received notes */}
      <AnimatePresence mode="popLayout">
        {receivedNotes.map((note, i) => (
          <PostIt
            key={note.id}
            note={note}
            label={`— ${partnerName}`}
            index={i}
            onDelete={handleDelete}
            onMarkRead={handleMarkRead}
          />
        ))}
      </AnimatePresence>

      {/* Sent unread notes */}
      {sentUnread.length > 0 && (
        <>
          <AnimatePresence mode="popLayout">
            {sentUnread.map((note, i) => (
              <PostIt
                key={note.id}
                note={note}
                label="Enviada — sin leer"
                index={i + receivedNotes.length}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
