import { useEffect, useRef, type RefObject } from 'react';

/** Zo ver (px) moet je vinger horizontaal bewegen voordat het als vegen telt. */
const DREMPEL = 60;

interface Acties {
  /** Vinger van links naar rechts. */
  naarRechts?: () => void;
  /** Vinger van rechts naar links. */
  naarLinks?: () => void;
}

/** In een invoerveld (tekst selecteren, cursor verplaatsen) telt vegen niet. */
const inInvoer = (doel: EventTarget | null) =>
  doel instanceof Element && !!doel.closest('input, textarea, select, [contenteditable="true"]');

/**
 * Horizontaal vegen over `element`, of over het hele scherm als je geen element meegeeft.
 * Alleen een duidelijk zijwaartse beweging telt, zodat gewoon scrollen en omlaag vegen blijven werken.
 */
export function useVeeg(acties: Acties, element?: RefObject<HTMLElement | null>) {
  const actiesRef = useRef(acties);
  actiesRef.current = acties;

  useEffect(() => {
    const doel: HTMLElement | Window = element?.current ?? window;
    let start: { x: number; y: number } | null = null;

    const begin = (e: Event) => {
      const t = (e as TouchEvent).touches[0];
      start = t && !inInvoer(e.target) && (e as TouchEvent).touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
    };
    const eind = (e: Event) => {
      const t = (e as TouchEvent).changedTouches[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < DREMPEL || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx > 0) actiesRef.current.naarRechts?.();
      else actiesRef.current.naarLinks?.();
    };

    doel.addEventListener('touchstart', begin, { passive: true });
    doel.addEventListener('touchend', eind, { passive: true });
    return () => {
      doel.removeEventListener('touchstart', begin);
      doel.removeEventListener('touchend', eind);
    };
  }, [element]);
}
