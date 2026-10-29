import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, CalendarX, ChartNoAxesColumnIncreasing, Settings, type LucideIcon } from 'lucide-react';
import './TabBar.css';

/** `actief` bepaalt bij welke adressen de tab oplicht (ook de schermen eronder). */
type Tab = { pad: string; label: string; icoon: LucideIcon; actief: (pad: string) => boolean };

const tabs: Tab[] = [
  { pad: '/', label: 'Agenda', icoon: Calendar, actief: (p) => p === '/' || p.startsWith('/agenda') },
  { pad: '/huiswerk', label: 'Huiswerk', icoon: BookOpen, actief: (p) => p.startsWith('/huiswerk') },
  { pad: '/cijfers', label: 'Cijfers', icoon: ChartNoAxesColumnIncreasing, actief: (p) => p.startsWith('/cijfers') },
  { pad: '/afwezigheid', label: 'Afwezigheid', icoon: CalendarX, actief: (p) => p.startsWith('/afwezigheid') },
  { pad: '/instellingen', label: 'Instellingen', icoon: Settings, actief: (p) => p.startsWith('/instellingen') },
];

export function TabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="tabbalk" aria-label="Hoofdmenu">
      {tabs.map(({ pad, label, icoon: Icoon, actief }) => (
        <NavLink
          key={pad}
          to={pad}
          className={`tabbalk__tab${actief(pathname) ? ' active' : ''}`}
          aria-current={actief(pathname) ? 'page' : undefined}
        >
          <Icoon size={24} strokeWidth={2} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
