import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallBanner } from './InstallBanner';
const CoachChat = lazy(() => import('../ai/CoachChat'));
import { AchievementUnlock } from '../achievements/AchievementUnlock';
import { useAchievements } from '../../hooks/useAchievements';
import { warmUpAudio } from '../../lib/sound-utils';

/**
 * Freezes the outlet content per animation instance so the exiting page
 * keeps showing its own content while the entering page mounts fresh.
 * Fixes blank-page bug caused by AnimatePresence mode="wait" + <Outlet />.
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

export function AppLayout() {
  const location = useLocation();
  const { newAchievement, dismissNewAchievement } = useAchievements();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const mainRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    if (mainRef.current) {
      scrollPositions.current.set(location.pathname, mainRef.current.scrollTop);
    }
  }, [location.pathname]);

  // Restore scroll position when pathname changes
  useEffect(() => {
    const saved = scrollPositions.current.get(location.pathname) || 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = saved;
    }
  }, [location.pathname]);

  // Warm up AudioContext on first user interaction so sounds work immediately
  useEffect(() => {
    function handleFirstInteraction() {
      warmUpAudio();
      window.removeEventListener('pointerdown', handleFirstInteraction);
    }
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <Header />
      <InstallBanner />
      <main ref={mainRef} onScroll={handleScroll} className="flex-1 px-4 pb-52 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <Suspense fallback={null}><CoachChat /></Suspense>
      <AchievementUnlock achievement={newAchievement} onDismiss={dismissNewAchievement} />
    </div>
  );
}
