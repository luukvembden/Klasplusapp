import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, LoaderCircle } from 'lucide-react';
import './ui.css';

/** Zo ver (px) moet je trekken voordat loslaten vernieuwt. */
const DREMPEL = 70;
/** De inhoud beweegt minder ver dan je vinger: voelt als een veer. */
const WEERSTAND = 0.5;

function scrollOuder(el: HTMLElement | null): HTMLElement | null {
  for (let x = el?.parentElement; x; x = x.parentElement) {
    const { overflowY } = getComputedStyle(x);
    if (overflowY === 'auto' || overflowY === 'scroll') return x;
  }
  return null;
}

/**
 * Omlaag vegen bovenaan een lijst haalt de gegevens opnieuw op.
 * Werkt binnen de lijst die al scrolt; alleen als die helemaal bovenaan staat.
 */
export function VegenOmTeVernieuwen({ onVernieuw, children }: { onVernieuw: () => Promise<void>; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [afstand, setAfstand] = useState(0);
  const [bezig, setBezig] = useState(false);
  const status = useRef({ start: 0, trekken: false, afstand: 0, bezig: false });
  const vernieuwRef = useRef(onVernieuw);
  vernieuwRef.current = onVernieuw;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = status.current;

    const begin = (e: TouchEvent) => {
      if (s.bezig || (scrollOuder(el)?.scrollTop ?? 0) > 0) return;
      s.start = e.touches[0].clientY;
      s.trekken = true;
    };
    const beweeg = (e: TouchEvent) => {
      if (!s.trekken) return;
      const dy = e.touches[0].clientY - s.start;
      if (dy <= 0) {
        s.afstand = 0;
        setAfstand(0);
        return;
      }
      // Zelf de beweging afhandelen in plaats van de pagina te laten meebewegen.
      e.preventDefault();
      s.afstand = Math.min(dy * WEERSTAND, DREMPEL * 1.6);
      setAfstand(s.afstand);
    };
    const los = async () => {
      if (!s.trekken) return;
      s.trekken = false;
      if (s.afstand < DREMPEL) {
        s.afstand = 0;
        setAfstand(0);
        return;
      }
      s.bezig = true;
      setBezig(true);
      setAfstand(DREMPEL * 0.7);
      try {
        await vernieuwRef.current();
      } finally {
        s.bezig = false;
        s.afstand = 0;
        setBezig(false);
        setAfstand(0);
      }
    };

    el.addEventListener('touchstart', begin, { passive: true });
    el.addEventListener('touchmove', beweeg, { passive: false });
    el.addEventListener('touchend', los);
    el.addEventListener('touchcancel', los);
    return () => {
      el.removeEventListener('touchstart', begin);
      el.removeEventListener('touchmove', beweeg);
      el.removeEventListener('touchend', los);
      el.removeEventListener('touchcancel', los);
    };
  }, []);

  const klaarOmLosTeLaten = afstand >= DREMPEL;

  return (
    <div ref={ref} className="vegen">
      {/* Tijdens het trekken direct meebewegen; pas bij loslaten soepel terugveren. */}
      <div
        className="vegen__teken"
        style={{ height: afstand, transition: status.current.trekken ? 'none' : undefined }}
        aria-hidden={!bezig}
      >
        {(afstand > 8 || bezig) && (
          <span className={`vegen__rondje${klaarOmLosTeLaten ? ' vegen__rondje--klaar' : ''}`}>
            {bezig ? (
              <LoaderCircle size={20} strokeWidth={2.2} className="vegen__draai" aria-label="Bezig met vernieuwen" />
            ) : (
              <ArrowDown size={20} strokeWidth={2.2} aria-hidden="true" />
            )}
          </span>
        )}
      </div>
      <div className="vegen__inhoud">{children}</div>
    </div>
  );
}
