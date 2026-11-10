import { dagEnMaand, dagNaam, datumInZin, weekNummer, zelfdeDag } from '../../lib/datum';
import { useInstellingen, wijzigInstellingen, type AgendaIndeling } from '../../lib/instellingen';
import './agenda.css';

interface Props {
  dag: Date;
  onVandaag: () => void;
}

const INDELINGEN: { waarde: AgendaIndeling; naam: string }[] = [
  { waarde: 'dag', naam: 'Dag' },
  { waarde: 'week', naam: 'Week' },
];

/**
 * Kop van de Agenda: grote titel met datum en week eronder, rechts de schakelaar Dag/Week.
 * Op vandaag heet de titel "Vandaag"; op een andere dag de weekdag, met een knop terug naar vandaag.
 */
export function AgendaKop({ dag, onVandaag }: Props) {
  const isVandaag = zelfdeDag(dag, new Date());
  const { indeling } = useInstellingen();

  return (
    <header className="agendakop">
      <div className="agendakop__tekst">
        <h1 className="agendakop__titel">{isVandaag ? 'Vandaag' : dagNaam(dag)}</h1>
        <span className="agendakop__sub">
          {isVandaag ? datumInZin(dag) : dagEnMaand(dag)} · week {weekNummer(dag)}
        </span>
      </div>

      <div className="agendakop__knoppen agendakop__knoppen--onder">
        {/* Dag of Week; Klas+ onthoudt de keuze. */}
        <div className="agendakop__wissel" role="group" aria-label="Weergave">
          {INDELINGEN.map(({ waarde, naam }) => (
            <button
              key={waarde}
              type="button"
              aria-pressed={indeling === waarde}
              onClick={() => wijzigInstellingen({ indeling: waarde })}
            >
              {naam}
            </button>
          ))}
        </div>
        {/* Op een andere dag: onder de schakelaar, zodat de titel ruimte houdt. */}
        {!isVandaag && (
          <button type="button" className="agendakop__vandaag agendakop__vandaag--klein" onClick={onVandaag}>
            Vandaag
          </button>
        )}
      </div>
    </header>
  );
}
