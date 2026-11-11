import { dagEnMaand, dagNaam, datumInZin, maandagVan, nlTijd, weekNummer, zelfdeDag } from '../../lib/datum';
import { useInstellingen, wijzigInstellingen, type AgendaIndeling } from '../../lib/instellingen';
import './agenda.css';

interface Props {
  dag: Date;
  /** In de weekweergave: de eerste en laatste dag die je ziet (ma–vr, of za–zo). Dan heet de kop "Week 46". */
  bereik?: [Date, Date];
  /** Nog een keer tikken op de gekozen weergave: terug naar vandaag (Dag) of deze week (Week). */
  onNaarNu: () => void;
}

const isWeekend = (d: Date) => [0, 6].includes(nlTijd(d).weekdag);
/** Valt dit blok (werkweek of weekend) in de huidige week? */
const ditBlok = (bereik: [Date, Date]) => zelfdeDag(maandagVan(bereik[0]), maandagVan(new Date()));

function kopTitel(bereik: [Date, Date]): string {
  if (isWeekend(bereik[0])) return ditBlok(bereik) ? 'Dit weekend' : 'Weekend';
  return ditBlok(bereik) ? 'Deze week' : `Week ${weekNummer(bereik[0])}`;
}

/** "9 – 13 november", of "30 november – 4 december" over een maandgrens. */
function bereikTekst([van, tot]: [Date, Date]): string {
  return nlTijd(van).maand === nlTijd(tot).maand
    ? `${nlTijd(van).dag} – ${dagEnMaand(tot)}`
    : `${dagEnMaand(van)} – ${dagEnMaand(tot)}`;
}

const INDELINGEN: { waarde: AgendaIndeling; naam: string }[] = [
  { waarde: 'dag', naam: 'Dag' },
  { waarde: 'week', naam: 'Week' },
];

/**
 * Kop van de Agenda: grote titel met datum en week eronder, rechts de schakelaar Dag/Week.
 * Op vandaag heet de titel "Vandaag"; op een andere dag de weekdag.
 */
export function AgendaKop({ dag, bereik, onNaarNu }: Props) {
  const isVandaag = zelfdeDag(dag, new Date());
  const { indeling } = useInstellingen();

  return (
    <header className="agendakop">
      <div className="agendakop__tekst">
        {bereik ? (
          <>
            {/*
              De huidige week heet "Deze week", het huidige weekend "Dit weekend"; dan staat het weeknummer
              achter de datums. Een ander weekend heet "Weekend" (ook met weeknummer), een andere week "Week 47".
            */}
            <h1 className="agendakop__titel">{kopTitel(bereik)}</h1>
            <span className="agendakop__sub">
              {bereikTekst(bereik)}
              {(ditBlok(bereik) || isWeekend(bereik[0])) && ` · week ${weekNummer(bereik[0])}`}
            </span>
          </>
        ) : (
          <>
            <h1 className="agendakop__titel">{isVandaag ? 'Vandaag' : dagNaam(dag)}</h1>
            <span className="agendakop__sub">
              {isVandaag ? datumInZin(dag) : dagEnMaand(dag)} · week {weekNummer(dag)}
            </span>
          </>
        )}
      </div>

      <div className="agendakop__knoppen">
        {/* Dag of Week; Klas+ onthoudt de keuze. Tik je op de weergave die al aan staat, dan ga je naar vandaag. */}
        <div className="agendakop__wissel" role="group" aria-label="Weergave">
          {INDELINGEN.map(({ waarde, naam }) => (
            <button
              key={waarde}
              type="button"
              aria-pressed={indeling === waarde}
              onClick={() => (indeling === waarde ? onNaarNu() : wijzigInstellingen({ indeling: waarde }))}
            >
              {naam}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
