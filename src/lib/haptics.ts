'use client';

/**
 * Trigger device vibration (tactile feedback).
 * Only works on supported devices (mostly Android, and some iOS PWAs).
 */
export const hapticLight = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(10); } catch {}
  }
};

export const hapticMedium = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(30); } catch {}
  }
};

export const hapticSuccess = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([15, 30, 20]); } catch {}
  }
};

export const hapticError = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([30, 50, 30]); } catch {}
  }
};
