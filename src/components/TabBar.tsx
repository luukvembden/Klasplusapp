import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, ChartNoAxesColumnIncreasing, Ellipsis, type LucideIcon } from 'lucide-react';
import { useOngelezen, verversOngelezen } from '../lib/ongelezen';
import './TabBar.css';

/** `actief` bepaalt bij welke adressen de tab oplicht (ook de schermen eronder). */
type Tab = { pad: string; label: string; icoon: LucideIcon; actief: (pad: string) => boolean };

const tabs: Tab[] = [
  { pad: '/', label: 'Agenda', icoon: Calendar, actief: (p) => p === '/' || p.startsWith('/agenda') },
  { pad: '/huiswerk', label: 'Huiswerk', icoon: BookOpen, actief: (p) => p.startsWith('/huiswerk') },
  { pad: '/cijfers', label: 'Cijfers', icoon: ChartNoAxesColumnIncreasing, actief: (p) => p.startsWith('/cijfers') },
  // Meer: Berichten, Opdrachten, Afwezigheid, Privacy en Instellingen.
  { pad: '/meer', label: 'Meer', icoon: Ellipsis, actief: (p) => p.startsWith('/meer') || p.startsWith('/instellingen') },
];

/** Velden waarin je typt (dus waarbij het toetsenbord opkomt); geen vinkjes, knoppen of schuifjes. */
const typVeld = (el: Element | null) =>
  !!el?.matches(
    'textarea, select, [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="file"])',
  );

/**
 * Op de telefoon: true zolang je in een tekstveld typt. De tabbalk gaat dan weg, zodat hij niet
 * boven het toetsenbord komt te hangen maar onderin (achter het toetsenbord) blijft.
 */
function useAanHetTypen(): boolean {
  const [typen, setTypen] = useState(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Bij het wisselen tussen twee velden komt eerst focusout en dan focusin: even wachten.
    const kijk = () => setTimeout(() => setTypen(typVeld(document.activeElement)), 0);
    document.addEventListener('focusin', kijk);
    document.addEventListener('focusout', kijk);
    return () => {
      document.removeEventListener('focusin', kijk);
      document.removeEventListener('focusout', kijk);
    };
  }, []);
  return typen;
}

/** `naarTab` mag de tik zelf afhandelen (terugschuiven naar de hoofdpagina); geeft dan true. */
export function TabBar({ naarTab }: { naarTab?: (pad: string) => boolean }) {
  const { pathname } = useLocation();
  const ongelezen = useOngelezen();
  const typen = useAanHetTypen();

  // Het rode getal bij Meer: bij het openen van de app, als je terugkomt in de app, en elke 5 minuten.
  useEffect(() => {
    verversOngelezen();
    const klok = setInterval(verversOngelezen, 5 * 60_000);
    const terug = () => document.visibilityState === 'visible' && verversOngelezen();
    document.addEventListener('visibilitychange', terug);
    return () => {
      clearInterval(klok);
      document.removeEventListener('visibilitychange', terug);
    };
  }, []);

  return (
    <nav className={`tabbalk${typen ? ' tabbalk--typen' : ''}`} aria-label="Hoofdmenu">
      {tabs.map(({ pad, label, icoon: Icoon, actief }) => (
        <NavLink
          key={pad}
          to={pad}
          className={`tabbalk__tab${actief(pathname) ? ' active' : ''}`}
          aria-current={actief(pathname) ? 'page' : undefined}
          onClick={(e) => {
            if (naarTab?.(pad)) e.preventDefault();
          }}
        >
          <span className="tabbalk__icoon">
            <Icoon size={24} strokeWidth={2} aria-hidden="true" />
            {pad === '/meer' && ongelezen > 0 && (
              <span className="tabbalk__teller" aria-label={`${ongelezen} ongelezen berichten`}>
                {ongelezen > 99 ? '99+' : ongelezen}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
