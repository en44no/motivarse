import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useHabits } from '../../hooks/useHabits';
import { useStreaks } from '../../hooks/useStreaks';
import { coachMessage, type CoachMessage } from '../../services/ai.service';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-text-muted"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function CoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { myHabits, todayHabits, todayLogs } = useHabits();
  const { bestStreak } = useStreaks();

  // Build context object
  function buildContext() {
    const userId = profile?.uid;
    const completedToday = todayLogs.filter(
      (l) => l.userId === userId && l.completed && todayHabits.some((h) => h.id === l.habitId)
    ).length;

    return {
      userName: profile?.displayName || 'Usuario',
      partnerName: partnerName || undefined,
      habitsCount: myHabits.length,
      completedToday,
      totalToday: todayHabits.length,
      bestStreak: bestStreak?.currentStreak || 0,
    };
  }

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  // Send welcome message on first open
  async function handleOpen() {
    setOpen(true);
    if (initialized) return;
    setInitialized(true);
    setLoading(true);

    const ctx = buildContext();
    const reply = await coachMessage(
      [{ role: 'user', content: 'Saluda al usuario brevemente y ofrecé ayuda con sus hábitos.' }],
      ctx
    );

    setLoading(false);
    if (reply) {
      setMessages([{ role: 'assistant', content: reply }]);
    } else {
      toast.error('No se pudo conectar con el Coach IA. Intentá de nuevo.');
      setInitialized(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: CoachMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    const ctx = buildContext();
    const reply = await coachMessage(nextMessages, ctx);

    setLoading(false);
    if (reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } else {
      toast.error('No se pudo obtener respuesta. Intentá de nuevo.');
    }
  }

  return (
    <>
      {/* FAB — izquierda, sobre la nav */}
      {createPortal(
        <button
          onClick={handleOpen}
          className="fixed bottom-28 left-4 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:bg-primary-hover transition-colors active:scale-90"
          title="Coach IA"
        >
          <Bot size={22} />
        </button>,
        document.body
      )}

      {/* Chat drawer */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />

              {/* Drawer */}
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-surface border-t border-border rounded-t-3xl max-w-lg mx-auto"
                style={{ height: '85vh' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Bot size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary">Coach IA</p>
                    <p className="text-xs text-text-muted">Moti · tu coach personal</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover flex items-center justify-center transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-surface-hover text-text-primary rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Loading dots */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-hover rounded-2xl rounded-bl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border shrink-0 flex gap-2 items-center pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Escribí tu mensaje..."
                    disabled={loading}
                    className="flex-1 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0 active:scale-90"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
