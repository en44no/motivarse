import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useNotes } from '../../hooks/useNotes';
import { markNoteRead } from '../../services/notes.service';
import { formatRelativeTime } from '../../lib/date-utils';
import type { NoteColor } from '../../types/notes';

// Post-it colors are domain (love notes) — intentionally warm & tactile.
const COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-300', border: 'border-yellow-400', text: 'text-yellow-950' },
  pink: { bg: 'bg-pink-300', border: 'border-pink-400', text: 'text-pink-950' },
  blue: { bg: 'bg-sky-300', border: 'border-sky-400', text: 'text-sky-950' },
  green: { bg: 'bg-emerald-300', border: 'border-emerald-400', text: 'text-emerald-950' },
  purple: { bg: 'bg-purple-300', border: 'border-purple-400', text: 'text-purple-950' },
};

// Slight random rotations for post-it feel (subtle, not bouncy)
const ROTATIONS = [-2, 1.5, -1, 2, -1.5];
const EASE = [0.32, 0.72, 0, 1] as const;

export function FloatingLoveNotes() {
  const { user } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const notes = useNotes();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const userId = user?.uid || null;

  // Unread notes received by me
  const unreadReceived = useMemo(
    () => notes.filter((n) => n.toUserId === userId && !n.read && !dismissedIds.has(n.id)),
    [notes, userId, dismissedIds],
  );

  const handleDismiss = useCallback(async (noteId: string) => {
    setDismissedIds((prev) => new Set(prev).add(noteId));
    await markNoteRead(noteId).catch(() => {});
  }, []);

  if (unreadReceived.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {unreadReceived.map((note, i) => {
          const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;
          const rotation = ROTATIONS[i % ROTATIONS.length];

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.94, rotate: rotation * 1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: rotation }}
              exit={{ opacity: 0, scale: 0.92, rotate: rotation + 4 }}
              transition={{ duration: 0.2, ease: EASE }}
              className={`relative ${colors.bg} ${colors.border} rounded-sm border px-5 pt-4 pb-3 shadow-md`}
            >
              {/* Folded corner — triangle in top-right, uses theme background token */}
              <div
                className="pointer-events-none absolute top-0 right-0 h-5 w-5"
                style={{
                  background:
                    'linear-gradient(225deg, var(--color-background) 50%, rgba(0,0,0,0.15) 50%)',
                }}
                aria-hidden
              />

              {/* Dismiss button — 44px touch target */}
              <button
                type="button"
                onClick={() => handleDismiss(note.id)}
                aria-label="Cerrar nota"
                className="absolute -top-1 right-6 flex h-11 w-11 items-center justify-center opacity-60 transition-opacity duration-150 hover:opacity-100"
              >
                <X size={16} className={colors.text} strokeWidth={2.5} />
              </button>

              {/* Emoji */}
              {note.emoji && (
                <span className="mb-1 block text-xl" aria-hidden>
                  {note.emoji}
                </span>
              )}

              {/* Note text */}
              <p
                className={`whitespace-pre-wrap break-words text-sm font-medium leading-relaxed ${colors.text}`}
              >
                {note.text}
              </p>

              {/* Footer */}
              <p className={`mt-2 text-2xs opacity-70 ${colors.text}`}>
                De {partnerName} · {formatRelativeTime(note.createdAt)}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
