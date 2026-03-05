import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useNotes } from '../../hooks/useNotes';
import { markNoteRead } from '../../services/notes.service';
import { formatRelativeTime } from '../../lib/date-utils';
import type { NoteColor } from '../../types/notes';

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-300', border: 'border-yellow-400', text: 'text-yellow-950' },
  pink:   { bg: 'bg-pink-300',   border: 'border-pink-400',   text: 'text-pink-950'   },
  blue:   { bg: 'bg-sky-300',    border: 'border-sky-400',    text: 'text-sky-950'     },
  green:  { bg: 'bg-emerald-300',border: 'border-emerald-400',text: 'text-emerald-950' },
  purple: { bg: 'bg-purple-300', border: 'border-purple-400', text: 'text-purple-950'  },
};

// Slight random rotations for post-it feel
const ROTATIONS = [-3, 2, -1.5, 3, -2];

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
              initial={{ opacity: 0, scale: 0.8, rotate: rotation * 2 }}
              animate={{ opacity: 1, scale: 1, rotate: rotation }}
              exit={{ opacity: 0, scale: 0.6, rotate: rotation + 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative ${colors.bg} ${colors.border} border rounded-sm shadow-md px-4 pt-4 pb-3`}
            >
              {/* Folded corner — triangle in top-right */}
              <div
                className="absolute top-0 right-0 w-5 h-5"
                style={{
                  background: 'linear-gradient(225deg, var(--color-background, #1a1a2e) 50%, rgba(0,0,0,0.15) 50%)',
                }}
              />

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(note.id)}
                aria-label="Cerrar nota"
                className="absolute top-1 right-7 w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={14} className={colors.text} />
              </button>

              {/* Emoji */}
              {note.emoji && (
                <span className="text-xl mb-1 block">{note.emoji}</span>
              )}

              {/* Note text */}
              <p className={`text-sm font-medium whitespace-pre-wrap break-words ${colors.text} leading-relaxed`}>
                {note.text}
              </p>

              {/* Footer */}
              <p className={`text-[10px] mt-2 ${colors.text} opacity-60`}>
                De {partnerName} · {formatRelativeTime(note.createdAt)}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
