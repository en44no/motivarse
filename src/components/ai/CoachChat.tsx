import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
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
import { cn } from '../../lib/utils';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-text-muted"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function CoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [memory, setMemory] = useState('');
  const newUserMessages = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // NOTE: intentionally NO autoFocus en el input — queda horrible en mobile con el teclado

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
          className={cn(
            'fixed bottom-28 left-4 w-12 h-12 rounded-full bg-primary text-primary-contrast',
            'shadow-[var(--shadow-glow-primary)] flex items-center justify-center z-30',
            'hover:bg-primary-hover transition-colors duration-150 ease-out active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
          aria-label="Abrir Coach IA"
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
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={handleClose}
              />

              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-surface border-t border-border/60 rounded-t-3xl max-w-lg mx-auto shadow-lg"
                style={{ height: '88vh' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Bot size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-text-primary leading-tight">
                      Coach IA
                    </p>
                    <p className="text-2xs text-text-muted mt-0.5">
                      Moti · tu coach personal
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    aria-label="Cerrar coach"
                    className="w-11 h-11 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover flex items-center justify-center transition-colors duration-150 ease-out"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center mb-3">
                        <Sparkles size={24} className="text-primary" />
                      </div>
                      <p className="text-base font-semibold text-text-primary mb-1">
                        Hola! Soy Moti
                      </p>
                      <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                        Preguntame lo que quieras sobre tus hábitos, tu racha o cómo mantenerte motivado.
                      </p>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={cn(
                            'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-contrast rounded-br-md font-medium'
                              : 'bg-surface-hover text-text-primary rounded-bl-md border border-border/60',
                          )}
                        >
                          {msg.role === 'user' ? (
                            msg.content
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-text-primary">{children}</strong>
                                ),
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>
                                ),
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                code: ({ children }) => (
                                  <code className="px-1.5 py-0.5 rounded bg-surface text-primary text-xs font-mono">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-hover border border-border/60 rounded-2xl rounded-bl-md">
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
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="px-4 pb-3 shrink-0"
                    >
                      <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {preQuestions.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSend(q)}
                            className={cn(
                              'shrink-0 rounded-full border border-border/80 bg-surface-hover text-text-secondary',
                              'text-xs font-medium px-3.5 py-2',
                              'hover:border-primary/60 hover:text-primary hover:bg-primary-soft',
                              'transition-colors duration-150 ease-out active:scale-95',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                            )}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border/60 shrink-0 flex gap-2 items-center pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Escribí tu mensaje..."
                    disabled={loading}
                    className={cn(
                      'flex-1 h-12 rounded-xl border border-border/60 bg-surface-hover px-4 text-sm text-text-primary',
                      'placeholder:text-text-muted/60',
                      'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40',
                      'transition-colors duration-150 ease-out disabled:opacity-50',
                    )}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className={cn(
                      'w-12 h-12 rounded-xl bg-primary text-primary-contrast flex items-center justify-center shrink-0',
                      'hover:bg-primary-hover transition-colors duration-150 ease-out active:scale-95',
                      'disabled:opacity-40 disabled:active:scale-100',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    )}
                    aria-label="Enviar mensaje"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
