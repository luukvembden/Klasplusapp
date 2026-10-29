import './instellingen.css';

interface Props<T extends string> {
  label: string;
  keuzes: { waarde: T; naam: string }[];
  gekozen: T;
  onKies: (waarde: T) => void;
}

/** Een rij knoppen waarvan er één tegelijk aan staat, zoals bij Thema en Agenda. */
export function Keuzeknoppen<T extends string>({ label, keuzes, gekozen, onKies }: Props<T>) {
  return (
    <section
      className="themakiezer"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${keuzes.length}, minmax(0, 1fr))` }}
    >
      {keuzes.map(({ waarde, naam }) => (
        <button key={waarde} type="button" aria-pressed={gekozen === waarde} onClick={() => onKies(waarde)}>
          {naam}
        </button>
      ))}
    </section>
  );
}
