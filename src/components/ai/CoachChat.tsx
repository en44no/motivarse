import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useHabits } from '../../hooks/useHabits';
import { useStreaks } from '../../hooks/useStreaks';
import { coachMessage, updateCoachMemory, type CoachMessage } from '../../services/ai.service';
import {
  loadCoachHistory,
  saveCoachHistory,
  loadCoachMemory,
  saveCoachMemory,
} from '../../services/coachMemory.service';

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
  const [memory, setMemory] = useState('');
  const newUserMessages = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { myHabits, todayHabits, todayLogs } = useHabits();
  const { bestStreak } = useStreaks();

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

  function buildPreQuestions(): string[] {
    const ctx = buildContext();
    const chips: string[] = [];

    if (ctx.completedToday === 0 && ctx.totalToday > 0) {
      chips.push('¿Cómo me motivo para arrancar hoy?');
    } else if (ctx.completedToday === ctx.totalToday && ctx.totalToday > 0) {
      chips.push('¡Completé todo! ¿Qué más puedo hacer?');
    }

    if (ctx.bestStreak >= 7) {
      chips.push(`¿Cómo mantengo mi racha de ${ctx.bestStreak} días?`);
    }

    const pool = [
      'Dame un consejo para hoy',
      '¿Qué hábito mejorar?',
      '¿Cómo va mi pareja?',
      'Necesito motivación',
    ];

    for (const item of pool) {
      if (chips.length >= 4) break;
      chips.push(item);
    }

    return chips.slice(0, 4);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  async function handleOpen() {
    setOpen(true);
    if (initialized) return;
    setInitialized(true);
    setLoading(true);

    const userId = profile?.uid;
    const [history, mem] = await Promise.all([
      userId ? loadCoachHistory(userId) : Promise.resolve([] as CoachMessage[]),
      userId ? loadCoachMemory(userId) : Promise.resolve(''),
    ]);

    setMemory(mem);

    if (history.length > 0) {
      setMessages(history);
      setLoading(false);
      return;
    }

    const ctx = buildContext();
    const reply = await coachMessage(
      [{ role: 'user', content: 'Saluda al usuario brevemente y ofrecé ayuda con sus hábitos.' }],
      { ...ctx, memory: mem }
    );

    setLoading(false);
    if (reply) {
      setMessages([{ role: 'assistant', content: reply }]);
    } else {
      toast.error('No se pudo conectar con el Coach IA. Intentá de nuevo.');
      setInitialized(false);
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: CoachMessage = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    newUserMessages.current++;

    const ctx = buildContext();
    const reply = await coachMessage(nextMessages, { ...ctx, memory });

    setLoading(false);
    if (reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } else {
      toast.error('No se pudo obtener respuesta. Intentá de nuevo.');
    }
  }

  function handleClose() {
    setOpen(false);
    const userId = profile?.uid;
    if (!userId || !messages.length) return;

    saveCoachHistory(userId, messages);

    if (newUserMessages.current >= 2) {
      const ctx = buildContext();
      updateCoachMemory(messages, memory, ctx.userName).then((newMem) => {
        if (newMem) saveCoachMemory(userId, newMem);
      });
    }

    newUserMessages.current = 0;
    setTimeout(() => setInitialized(false), 300);
  }

  const preQuestions = buildPreQuestions();
  const showChips = messages.length <= 1 && !loading;

  return (
    <>
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

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
              />

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
                    onClick={handleClose}
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

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-hover rounded-2xl rounded-bl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Pre-questions chips */}
                <AnimatePresence>
                  {showChips && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="px-4 pb-2 shrink-0"
                    >
                      <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {preQuestions.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSend(q)}
                            className="shrink-0 rounded-full border border-border bg-surface-hover text-text-secondary text-xs px-3 py-1.5 hover:border-primary/60 hover:text-primary transition-colors active:scale-95"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                    onClick={() => handleSend()}
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
