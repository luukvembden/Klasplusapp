import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import './ui.css';

/** Zo lang duurt het doorglijden of terugveren (ms). */
const DUUR = 260;
/**
 * De baan staat in rust op het middelste vak: één vak naar links. Een percentage in translateX gaat uit
 * van de breedte van de baan zelf, en die is precies één vak breed (de vakken steken erbuiten uit).
 */
const MIDDEN = -100;

interface Props {
  /** Verandert als de getoonde dag of week verandert; dan springt de baan stil terug naar het midden. */
  sleutel: string;
  vorige: ReactNode;
  huidige: ReactNode;
  volgende: ReactNode;
  onVorige: () => void;
  onVolgende: () => void;
  /**
   * Het vlak waarop je kunt vegen, bijvoorbeeld de hele lijst tot aan de balk onderin, ook het lege
   * stuk onder de laatste les. Zonder dit alleen de baan zelf.
   */
  vlak?: RefObject<HTMLElement | null>;
}

/** In een invoerveld (tekst selecteren, cursor verplaatsen) telt vegen niet. */
const inInvoer = (doel: EventTarget | null) =>
  doel instanceof Element && !!doel.closest('input, textarea, select, [contenteditable="true"]');

/**
 * Drie vakken naast elkaar: vorige, huidige en volgende dag (of week). Tijdens het vegen schuift de baan
 * met je vinger mee, zodat je de volgende ziet binnenkomen en de huidige ziet verdwijnen. Laat je ver
 * genoeg los, dan glijdt hij door en wordt de volgende de huidige; anders veert hij terug.
 */
export function VeegCarrousel({ sleutel, vorige, huidige, volgende, onVorige, onVolgende, vlak }: Props) {
  const houder = useRef<HTMLDivElement>(null);
  const baan = useRef<HTMLDivElement>(null);
  const acties = useRef({ onVorige, onVolgende });
  acties.current = { onVorige, onVolgende };

  // Nieuwe dag getoond: zonder animatie terug naar het midden, vóór het scherm opnieuw getekend wordt.
  useLayoutEffect(() => {
    const el = baan.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = `translateX(${MIDDEN}%)`;
  }, [sleutel]);

  useEffect(() => {
    const el = vlak?.current ?? houder.current;
    const b = baan.current;
    if (!el || !b) return;

    let start: { x: number; y: number; t: number } | null = null;
    /** null: nog niet besloten; true: zijwaarts vegen; false: gewoon scrollen. */
    let zijwaarts: boolean | null = null;
    let dx = 0;
    let bezig = false;

    const zet = (px: number, duur = 0, eind?: number) => {
      b.style.transition = duur ? `transform ${duur}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none';
      b.style.transform = eind === undefined ? `translateX(calc(${MIDDEN}% + ${px}px))` : `translateX(${eind}%)`;
    };

    const begin = (e: TouchEvent) => {
      if (bezig) return;
      const t = e.touches[0];
      start = e.touches.length === 1 && !inInvoer(e.target) ? { x: t.clientX, y: t.clientY, t: e.timeStamp } : null;
      zijwaarts = null;
      dx = 0;
    };

    const beweeg = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const x = t.clientX - start.x;
      const y = t.clientY - start.y;
      if (zijwaarts === null) {
        if (Math.abs(x) < 10 && Math.abs(y) < 10) return;
        zijwaarts = Math.abs(x) > Math.abs(y) * 1.2;
      }
      if (!zijwaarts) return;
      // Niet tegelijk de lijst laten scrollen.
      e.preventDefault();
      dx = x;
      zet(dx);
    };

    const eind = (e: TouchEvent) => {
      if (!start || !zijwaarts) {
        start = null;
        return;
      }
      const snelheid = Math.abs(dx) / Math.max(e.timeStamp - start.t, 1);
      start = null;
      const ver = Math.abs(dx) > el.clientWidth * 0.25 || (Math.abs(dx) > 30 && snelheid > 0.5);
      if (!ver) {
        zet(0, DUUR);
        return;
      }
      // Doorglijden naar het buurvak, dan pas de dag wisselen (de baan springt daarna stil terug).
      bezig = true;
      const naarVolgende = dx < 0;
      zet(0, DUUR, naarVolgende ? 2 * MIDDEN : 0);
      setTimeout(() => {
        bezig = false;
        if (naarVolgende) acties.current.onVolgende();
        else acties.current.onVorige();
      }, DUUR);
    };

    el.addEventListener('touchstart', begin, { passive: true });
    el.addEventListener('touchmove', beweeg, { passive: false });
    el.addEventListener('touchend', eind, { passive: true });
    el.addEventListener('touchcancel', eind, { passive: true });
    return () => {
      el.removeEventListener('touchstart', begin);
      el.removeEventListener('touchmove', beweeg);
      el.removeEventListener('touchend', eind);
      el.removeEventListener('touchcancel', eind);
    };
  }, [vlak]);

  return (
    <div ref={houder} className="carrousel">
      <div ref={baan} className="carrousel__baan">
        <div className="carrousel__vak" aria-hidden="true" inert>
          {vorige}
        </div>
        <div className="carrousel__vak">{huidige}</div>
        <div className="carrousel__vak" aria-hidden="true" inert>
          {volgende}
        </div>
      </div>
    </div>
  );
}
