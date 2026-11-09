import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, CalendarX, ChartNoAxesColumnIncreasing, Ellipsis, type LucideIcon } from 'lucide-react';
import { useOngelezen, verversOngelezen } from '../lib/ongelezen';
import './TabBar.css';

/** `actief` bepaalt bij welke adressen de tab oplicht (ook de schermen eronder). */
type Tab = { pad: string; label: string; icoon: LucideIcon; actief: (pad: string) => boolean };

const tabs: Tab[] = [
  { pad: '/', label: 'Agenda', icoon: Calendar, actief: (p) => p === '/' || p.startsWith('/agenda') },
  { pad: '/huiswerk', label: 'Huiswerk', icoon: BookOpen, actief: (p) => p.startsWith('/huiswerk') },
  { pad: '/cijfers', label: 'Cijfers', icoon: ChartNoAxesColumnIncreasing, actief: (p) => p.startsWith('/cijfers') },
  { pad: '/afwezigheid', label: 'Afwezigheid', icoon: CalendarX, actief: (p) => p.startsWith('/afwezigheid') },
  // Meer: Berichten, Opdrachten, Privacy en Instellingen.
  { pad: '/meer', label: 'Meer', icoon: Ellipsis, actief: (p) => p.startsWith('/meer') || p.startsWith('/instellingen') },
];

/** `naarTab` mag de tik zelf afhandelen (terugschuiven naar de hoofdpagina); geeft dan true. */
export function TabBar({ naarTab }: { naarTab?: (pad: string) => boolean }) {
  const { pathname } = useLocation();
  const ongelezen = useOngelezen();

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
    <nav className="tabbalk" aria-label="Hoofdmenu">
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
