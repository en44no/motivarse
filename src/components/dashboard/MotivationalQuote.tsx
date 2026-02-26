import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { getQuoteOfTheDay } from '../../lib/quotes';

export function MotivationalQuote() {
  const quote = getQuoteOfTheDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-light p-5"
    >
      {/* Subtle decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />

      <div className="relative">
        <Quote size={20} className="text-accent/40 mb-3" />

        <p className="text-[15px] leading-relaxed text-text-primary font-medium italic">
          "{quote.text}"
        </p>

        <p className="mt-3 text-xs font-semibold text-text-muted tracking-wide">
          — {quote.author}
        </p>
      </div>
    </motion.div>
  );
}
