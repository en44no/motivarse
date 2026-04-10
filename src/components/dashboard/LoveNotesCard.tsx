import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { sendNote } from '../../services/notes.service';
import { cn } from '../../lib/utils';

const DEFAULT_EMOJIS = ['😘', '❤️', '💕', '🥰', '💋', '✨', '🌹', '💌'];

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

  const canSend = !!text.trim() && !sending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nota de amor"
      subtitle={`Un mensaje para ${partnerName}`}
      size="sm"
      footer={
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!canSend}
          onClick={handleSend}
          className="w-full"
        >
          <Send size={16} />
          {sending ? 'Enviando...' : 'Enviar nota'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <textarea
            aria-label="Escribe una nota de amor"
            className="w-full rounded-xl bg-surface-light border border-border p-4 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            placeholder={`Escribile algo lindo a ${partnerName}...`}
            rows={4}
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end mt-1">
            <span className="text-2xs text-text-muted tabular-nums">
              {text.length}/200
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs text-text-muted mb-2 block">
            Emoji (opcional)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`Emoji ${e}`}
                onClick={() => {
                  setEmoji(emoji === e ? undefined : e);
                  setCustomEmoji('');
                }}
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all',
                  emoji === e && !customEmoji
                    ? 'bg-primary-soft ring-2 ring-primary/40 scale-105'
                    : 'bg-surface-light hover:bg-surface-hover active:scale-90',
                )}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-text-muted">o escribí uno:</span>
            <input
              type="text"
              aria-label="Seleccionar emoji"
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
      </div>
    </Dialog>
  );
}
