import { useInstellingen, wijzigInstellingen, type AgendaIndeling, type AgendaWeergave, type Kleur, type Thema } from '../../lib/instellingen';
import { Keuzeknoppen } from './Keuzeknoppen';

const themas: { waarde: Thema; naam: string }[] = [
  { waarde: 'licht', naam: 'Licht' },
  { waarde: 'donker', naam: 'Donker' },
  { waarde: 'systeem', naam: 'Systeem' },
];

const agendaWeergaven: { waarde: AgendaWeergave; naam: string }[] = [
  { waarde: 'modern', naam: 'Modern' },
  { waarde: 'klassiek', naam: 'Klassiek' },
];

const indelingen: { waarde: AgendaIndeling; naam: string }[] = [
  { waarde: 'dag', naam: 'Dag' },
  { waarde: 'week', naam: 'Week' },
];

/** Eén dag onder elkaar, of de hele week in één rooster. */
export function AgendaIndelingKiezer() {
  const { indeling } = useInstellingen();
  return (
    <Keuzeknoppen
      label="Weergave"
      keuzes={indelingen}
      gekozen={indeling}
      onKies={(i) => wijzigInstellingen({ indeling: i })}
    />
  );
}

export function ThemaKiezer() {
  const { thema } = useInstellingen();
  return <Keuzeknoppen label="Thema" keuzes={themas} gekozen={thema} onKies={(t) => wijzigInstellingen({ thema: t })} />;
}

/** Hoe de lessen in de Agenda er uitzien. */
export function AgendaWeergaveKiezer() {
  const { agenda } = useInstellingen();
  return (
    <Keuzeknoppen
      label="Agenda"
      keuzes={agendaWeergaven}
      gekozen={agenda}
      onKies={(a) => wijzigInstellingen({ agenda: a })}
    />
  );
}

/** De kleurensets, met een stip in de eigen kleur (vast, zodat je ze naast elkaar ziet). In twee rijen van drie. */
const kleuren: { waarde: Kleur; naam: string; stip: string }[] = [
  { waarde: 'groen', naam: 'Groen', stip: '#2e6b5a' },
  { waarde: 'blauw', naam: 'Blauw', stip: '#2f63a8' },
  { waarde: 'roze', naam: 'Roze', stip: '#c2417f' },
];

/** Accentkleur van de app: knoppen, de dagstrook, labels en links. */
export function KleurKiezer() {
  const { kleur } = useInstellingen();
  return (
    <section className="themakiezer" aria-label="Kleur" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
      {kleuren.map(({ waarde, naam, stip }) => (
        <button
          key={waarde}
          type="button"
          className="kleurknop"
          aria-pressed={kleur === waarde}
          onClick={() => wijzigInstellingen({ kleur: waarde })}
        >
          <span className="kleurknop__stip" style={{ background: stip }} aria-hidden="true" />
          {naam}
        </button>
      ))}
    </section>
  );
}
