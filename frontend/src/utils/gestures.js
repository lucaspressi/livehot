/**
 * Touch gesture handlers for mobile interactions.
 * Each handler attaches listeners to the provided element and
 * returns a cleanup function to remove them.
 */

export function handleSwipeUp(element, callback, threshold = 30) {
  let startY = null;

  function onTouchStart(e) {
    startY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (startY === null) return;
    const diff = startY - e.changedTouches[0].clientY;
    if (diff > threshold) {
      callback(e);
    }
    startY = null;
  }

  element.addEventListener('touchstart', onTouchStart);
  element.addEventListener('touchend', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

export function handleSwipeDown(element, callback, threshold = 30) {
  let startY = null;

  function onTouchStart(e) {
    startY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (startY === null) return;
    const diff = e.changedTouches[0].clientY - startY;
    if (diff > threshold) {
      callback(e);
    }
    startY = null;
  }

  element.addEventListener('touchstart', onTouchStart);
  element.addEventListener('touchend', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

export function handleTap(element, callback, delay = 200) {
  let touchStart = 0;
  let startX = null;
  let startY = null;
  const moveThreshold = 10;

  function onTouchStart(e) {
    touchStart = Date.now();
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    const time = Date.now() - touchStart;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const distX = Math.abs(endX - startX);
    const distY = Math.abs(endY - startY);

    if (time < delay && distX < moveThreshold && distY < moveThreshold) {
      callback(e);
    }
  }

  element.addEventListener('touchstart', onTouchStart);
  element.addEventListener('touchend', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

export default { handleSwipeUp, handleSwipeDown, handleTap };
