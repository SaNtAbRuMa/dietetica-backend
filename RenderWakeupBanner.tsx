import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RenderWakeupBannerProps {
  isLoading: boolean;
}

// Render free tier "duerme" tras 15 min de inactividad.
// Si la carga tarda más de 5s, mostramos un banner explicativo.
const SLOW_THRESHOLD_MS = 5000;

export function RenderWakeupBanner({ isLoading }: RenderWakeupBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowBanner(false);
      return;
    }
    const timer = setTimeout(() => {
      if (isLoading) setShowBanner(true);
    }, SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl shadow-md text-sm flex items-center gap-2 max-w-sm text-center"
        >
          <span>☕</span>
          <span>El servidor está despertando, tardará unos segundos más...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
