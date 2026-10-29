import { useInstellingen, wijzigInstellingen, type AgendaWeergave, type Thema } from '../../lib/instellingen';
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
