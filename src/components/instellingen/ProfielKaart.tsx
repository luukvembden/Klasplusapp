import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { Profiel } from '../../api';
import './instellingen.css';

interface Props {
  profiel?: Profiel;
  /** Alleen voor ouders: er is een ander kind gekozen. */
  onKiesKind?: (id: number) => Promise<void>;
}

export function ProfielKaart({ profiel, onKiesKind }: Props) {
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);

  if (!profiel?.ouder) {
    return (
      <section className="kaart profielkaart" aria-busy={!profiel}>
        {profiel && (
          <>
            <div className="profielkaart__avatar" aria-hidden="true">
              {profiel.initialen}
            </div>
            <div className="profielkaart__tekst">
              <span className="profielkaart__naam">{profiel.naam}</span>
              <span className="profielkaart__school">
                {profiel.school} · {profiel.klas}
              </span>
            </div>
          </>
        )}
      </section>
    );
  }

  // Ouder: bovenaan de ouder zelf, met eronder het kind dat de app nu toont. Tik om te wisselen.
  const { kinderen, gekozen } = profiel.ouder;
  const kind = kinderen.find((k) => k.id === gekozen);

  const kies = async (id: number) => {
    setOpen(false);
    if (id === gekozen || !onKiesKind) return;
    setBezig(true);
    try {
      await onKiesKind(id);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className="kaart profielkaart--ouder" aria-busy={bezig}>
      <button
        type="button"
        className="profielkaart profielkaart__knop"
        aria-expanded={open}
        aria-controls="kindkiezer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="profielkaart__avatar" aria-hidden="true">
          {profiel.initialen}
        </div>
        <div className="profielkaart__tekst">
          <span className="profielkaart__naam">{profiel.naam}</span>
          <span className="profielkaart__school">
            {bezig ? 'Wisselen…' : [kind?.naam, profiel.klas].filter(Boolean).join(' · ')}
          </span>
        </div>
        <ChevronDown
          className={`profielkaart__pijl${open ? ' profielkaart__pijl--open' : ''}`}
          size={22}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id="kindkiezer" className="kindkiezer" aria-label="Kies een kind">
          {kinderen.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                className="kindkiezer__rij"
                aria-current={k.id === gekozen || undefined}
                onClick={() => kies(k.id)}
              >
                <span className="kindkiezer__avatar" aria-hidden="true">
                  {k.initialen}
                </span>
                <span className="kindkiezer__naam">{k.naam}</span>
                {k.id === gekozen && <Check size={20} strokeWidth={2.4} color="var(--groen-tekst)" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
