import { useState } from 'react';
import { Invoerrij } from '../les/Invoerrij';
import { Sectie } from '../ui/Sectie';
import type { Profiel } from '../../api/types';
import { bewaarNiveauKeuze, herkenNiveau, klasTekst, leesNiveauKeuze, NIVEAU_NAAM, type Niveau, type NiveauKeuze } from '../../lib/examen';

const NIVEAUS = Object.keys(NIVEAU_NAAM) as Niveau[];

/**
 * Zit je in je examenjaar? Klas+ herkent het aan de naam van je studie en klas; klopt dat niet, dan stel je
 * het hier zelf in. Staat bij de normen van de overgangscheck en bij Mijn vakken van de Examencheck.
 */
export function ExamenjaarKeuze({ profiel, onWijzig }: { profiel: Profiel | undefined; onWijzig?: (k: NiveauKeuze) => void }) {
  const [keuze, setKeuze] = useState<NiveauKeuze>(leesNiveauKeuze);
  const herkend = herkenNiveau(klasTekst(profiel));

  const kies = (k: NiveauKeuze) => {
    setKeuze(k);
    bewaarNiveauKeuze(k);
    onWijzig?.(k);
  };

  return (
    <Sectie
      titel="Examenjaar"
      nawoord={
        <p className="instellingen__let-op">
          Klas+ herkent je examenjaar aan de naam van je klas
          {profiel?.klas ? ` (${profiel.klas})` : ''}. Klopt het niet, kies het dan hier.
        </p>
      }
    >
      <section className="kaart">
        <Invoerrij label="Examenjaar" voor="examenjaar">
          <select
            id="examenjaar"
            className="invoerrij__veld invoerrij__keuze"
            value={keuze}
            onChange={(e) => kies(e.target.value as NiveauKeuze)}
          >
            <option value="auto">Automatisch{herkend ? ` (${NIVEAU_NAAM[herkend]})` : ' (geen)'}</option>
            <option value="geen">Geen examenjaar</option>
            {NIVEAUS.map((n) => (
              <option key={n} value={n}>
                {NIVEAU_NAAM[n]}
              </option>
            ))}
          </select>
        </Invoerrij>
      </section>
    </Sectie>
  );
}
