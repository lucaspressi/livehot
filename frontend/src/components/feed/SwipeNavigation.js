import { useEffect, useRef } from 'react';

function SwipeNavigation({ onSwipeLeft, onSwipeRight, children }) {
  const startX = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const diff = e.changedTouches[0].clientX - startX.current;
      if (diff > 50 && onSwipeRight) onSwipeRight();
      if (diff < -50 && onSwipeLeft) onSwipeLeft();
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {children}
    </div>
  );
}

export default SwipeNavigation;
