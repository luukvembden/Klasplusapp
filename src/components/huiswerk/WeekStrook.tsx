import { ChevronLeft, ChevronRight } from 'lucide-react';
import { plusDagen, weekBereik, weekNummer } from '../../lib/datum';
import '../agenda/agenda.css';
import './huiswerk.css';

/** Zoals de dagstrook van de Agenda, maar per week: pijltjes en "Week 44 · 26 okt – 1 nov". */
export function WeekStrook({ week, onKies }: { week: Date; onKies: (week: Date) => void }) {
  return (
    <div className="dagstrook weekstrook">
      <button type="button" className="dagstrook__pijl" aria-label="Vorige week" onClick={() => onKies(plusDagen(week, -7))}>
        <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="weekstrook__midden" aria-live="polite">
        <span className="weekstrook__week">Week {weekNummer(week)}</span>
        <span className="weekstrook__bereik">{weekBereik(week)}</span>
      </div>
      <button type="button" className="dagstrook__pijl" aria-label="Volgende week" onClick={() => onKies(plusDagen(week, 7))}>
        <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
