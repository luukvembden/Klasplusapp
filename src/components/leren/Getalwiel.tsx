import { useEffect, useRef } from 'react';
import './leren.css';

const HOOGTE = 40;

interface Props {
  id: string;
  waarde: number;
  van: number;
  tot: number;
  /** "dag" / "dagen" achter het getal in het midden. */
  eenheid: (n: number) => string;
  onKies: (n: number) => void;
  label: string;
}

/**
 * Een draaiwiel met getallen, zoals de tijdkiezer op een iPhone: veeg omhoog of omlaag, het getal in
 * het midden is gekozen. Met de pijltjestoetsen gaat het ook.
 */
export function Getalwiel({ id, waarde, van, tot, eenheid, onKies, label }: Props) {
  const wiel = useRef<HTMLDivElement>(null);
  const getallen = Array.from({ length: Math.max(tot - van + 1, 1) }, (_, i) => van + i);
  const stilTot = useRef(0);

  // Een keuze van buiten (snelknop, of de grens verschoof): het wiel draait mee.
  useEffect(() => {
    const el = wiel.current;
    if (!el) return;
    const doel = (waarde - van) * HOOGTE;
    if (Math.abs(el.scrollTop - doel) < 2) return;
    stilTot.current = Date.now() + 400;
    el.scrollTo({ top: doel, behavior: 'smooth' });
  }, [waarde, van]);

  // Na het draaien: het getal dat in het midden staat.
  useEffect(() => {
    const el = wiel.current;
    if (!el) return;
    let wacht: ReturnType<typeof setTimeout>;
    const opScroll = () => {
      clearTimeout(wacht);
      wacht = setTimeout(() => {
        if (Date.now() < stilTot.current) return;
        const n = Math.min(tot, Math.max(van, van + Math.round(el.scrollTop / HOOGTE)));
        if (n !== waarde) onKies(n);
      }, 90);
    };
    el.addEventListener('scroll', opScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', opScroll);
      clearTimeout(wacht);
    };
  }, [van, tot, waarde, onKies]);

  return (
    <div className="getalwiel">
      <div className="getalwiel__band" aria-hidden="true" />
      <div
        id={id}
        ref={wiel}
        className="getalwiel__baan"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={van}
        aria-valuemax={tot}
        aria-valuenow={waarde}
        aria-valuetext={`${waarde} ${eenheid(waarde)}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onKies(Math.max(van, waarde - 1));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            onKies(Math.min(tot, waarde + 1));
          }
        }}
      >
        {getallen.map((n) => (
          <div
            key={n}
            className={`getalwiel__getal${n === waarde ? ' getalwiel__getal--gekozen' : ''}`}
            onClick={() => onKies(n)}
          >
            {n}
            {n === waarde && <span className="getalwiel__eenheid">{eenheid(n)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
