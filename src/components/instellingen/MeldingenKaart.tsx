import { useInstellingen, wijzigInstellingen, type Meldingen } from '../../lib/instellingen';
import './instellingen.css';

const soorten: { sleutel: keyof Meldingen; tekst: string }[] = [
  { sleutel: 'nieuwCijfer', tekst: 'Nieuw cijfer' },
  { sleutel: 'roosterwijziging', tekst: 'Roosterwijziging' },
];

export function MeldingenKaart() {
  const { meldingen } = useInstellingen();

  return (
    <section className="kaart">
      {soorten.map(({ sleutel, tekst }) => (
        <label key={sleutel} className="instelrij">
          <span>{tekst}</span>
          <input
            type="checkbox"
            role="switch"
            checked={meldingen[sleutel]}
            onChange={() => wijzigInstellingen({ meldingen: { ...meldingen, [sleutel]: !meldingen[sleutel] } })}
          />
        </label>
      ))}
    </section>
  );
}
