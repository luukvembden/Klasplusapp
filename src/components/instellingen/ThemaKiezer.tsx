import { useInstellingen, wijzigInstellingen, type AgendaWeergave, type Kleur, type Thema } from '../../lib/instellingen';
import { Keuzeknoppen } from './Keuzeknoppen';

const themas: { waarde: Thema; naam: string }[] = [
  { waarde: 'licht', naam: 'Licht' },
  { waarde: 'donker', naam: 'Donker' },
  { waarde: 'systeem', naam: 'Systeem' },
];

const agendaWeergaven: { waarde: AgendaWeergave; naam: string }[] = [
  { waarde: 'klassiek', naam: 'Klassiek' },
  { waarde: 'modern', naam: 'Modern' },
];

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

/** De drie kleurensets, met een stip in de eigen kleur (vast, zodat je ze naast elkaar ziet). */
const kleuren: { waarde: Kleur; naam: string; stip: string }[] = [
  { waarde: 'groen', naam: 'Groen', stip: '#2e6b5a' },
  { waarde: 'blauw', naam: 'Blauw', stip: '#2f63a8' },
  { waarde: 'donkerblauw', naam: 'Donkerblauw', stip: '#1f3a68' },
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
