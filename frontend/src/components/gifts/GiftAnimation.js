import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function GiftAnimation({ giftType, isVisible, onComplete }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={onComplete}
        >
          <div className="text-4xl font-bold text-white drop-shadow-lg">
            {giftType}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GiftAnimation;
