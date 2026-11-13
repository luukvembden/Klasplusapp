import { useMemo, useState } from 'react';
import { ExamenjaarKeuze } from '../components/cijfers/ExamenjaarKeuze';
import { Invoerrij } from '../components/les/Invoerrij';
import { LaadKaart } from '../components/ui/Laden';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { useCijfers } from '../hooks/useCijfers';
import { perVak } from '../lib/cijfers';
import { bewaarKeuzes, examenNiveau, isVmbo, leesKeuzes, soortVan, standaardSoort, type ExamenSoort, type Niveau } from '../lib/examen';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/instellingen/instellingen.css';

/**
 * havo/vwo: vinkje uit = geen centraal examen. Dan telt het in het combinatiecijfer, behalve vakken die
 * Klas+ kent als "alleen schoolexamen" (informatica, wiskunde D, NLT, BSM).
 */
const zonderCe = (naam: string, niveau: Niveau): ExamenSoort => (standaardSoort(naam, niveau) === 'se' ? 'se' : 'combi');

/** De keuzes per vak; "Profielvak" bestaat alleen bij vmbo gemengd. */
function soorten(niveau: Niveau): { waarde: ExamenSoort; tekst: string }[] {
  return [
    { waarde: 'ce', tekst: 'Centraal examen' },
    { waarde: 'se', tekst: 'Alleen schoolexamen' },
    ...(niveau === 'gl' ? [{ waarde: 'profiel' as const, tekst: 'Profielvak' }] : []),
    { waarde: 'combi', tekst: isVmbo(niveau) ? 'Keuzevak (combinatiecijfer)' : 'Combinatiecijfer' },
    { waarde: 'niet', tekst: 'Telt niet mee' },
  ];
}

/**
 * Bij de Examencheck (tandwieltje): per vak hoe het meetelt. Klas+ vult het zelf in aan de hand van de
 * naam; jij kijkt het na. Ook je examenjaar kun je hier zelf instellen.
 */
export function ExamenVakken() {
  const { cijfers, profiel } = useCijfers();
  const vakken = useMemo(() => (cijfers ? perVak(cijfers) : []), [cijfers]);
  const [keuzes, setKeuzes] = useState(leesKeuzes);
  const [, ververs] = useState(0);
  const niveau = examenNiveau(profiel);

  const kies = (code: string, soort: ExamenSoort) => {
    const nieuw = { ...keuzes, [code]: soort };
    setKeuzes(nieuw);
    bewaarKeuzes(nieuw);
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        {/* Na het wijzigen van je examenjaar blijf je hier; de terugknop gaat naar de check die dan geldt. */}
        {niveau || !profiel ? (
          <TerugLink naar="/cijfers/examen" label="Examencheck" />
        ) : (
          <TerugLink naar="/cijfers/overgang" label="Overgangscheck" />
        )}
        <PaginaKop sub="Hoe elk vak meetelt" titel="Mijn vakken" />
      </VasteKop>
      <ExamenjaarKeuze profiel={profiel} onWijzig={() => ververs((n) => n + 1)} />
      {!cijfers && <LaadKaart rijen={6} />}
      {cijfers && vakken.length === 0 && <p className="melding">Nog geen vakken met cijfers.</p>}
      {/* havo en vwo: per vak aanvinken of het een centraal examen heeft. */}
      {niveau && !isVmbo(niveau) && vakken.length > 0 && (
        <Sectie
          titel="Centraal examen"
          nawoord={
            <p className="instellingen__let-op">
              Zet uit bij vakken zonder centraal examen. Maatschappijleer, CKV en het profielwerkstuk tellen dan samen
              als één combinatiecijfer; vakken als informatica tellen met alleen hun schoolexamen. Lichamelijke
              opvoeding telt niet mee in de cijfers en staat er niet bij.
            </p>
          }
        >
          <section className="kaart">
            {vakken
              .filter((v) => standaardSoort(v.vak.naam, niveau) !== 'niet')
              .map((v) => (
                <label key={v.vak.code} className="instelrij meldingrij" htmlFor={`examen-${v.vak.code}`}>
                  <span className="meldingrij__tekst">
                    <span>{v.vak.naam}</span>
                  </span>
                  <input
                    id={`examen-${v.vak.code}`}
                    type="checkbox"
                    role="switch"
                    checked={soortVan(v, keuzes, niveau) === 'ce'}
                    onChange={(e) => kies(v.vak.code, e.target.checked ? 'ce' : zonderCe(v.vak.naam, niveau))}
                  />
                </label>
              ))}
          </section>
        </Sectie>
      )}

      {/* vmbo: meer soorten vakken (keuzevakken, profielvak, alleen schoolexamen), dus per vak een keuzelijst. */}
      {niveau && isVmbo(niveau) && vakken.length > 0 && (
        <Sectie
          titel="Per vak"
          nawoord={
            <p className="instellingen__let-op">
              {niveau === 'gl'
                ? 'Het profielvak en de beroepsgerichte keuzevakken vormen samen het combinatiecijfer; het profielvak telt daarin zo vaak mee als je keuzevakken hebt. Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding, kunstvakken en het profielwerkstuk krijgen een voldoende of goed en tellen niet mee in de cijfers.'
                : niveau === 'tl'
                  ? 'Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding, kunstvakken en het profielwerkstuk krijgen een voldoende of goed en tellen niet mee in de cijfers.'
                  : 'Je beroepsgerichte keuzevakken vormen samen het combinatiecijfer. Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding en kunstvakken krijgen een voldoende of goed en tellen niet mee in de cijfers.'}
            </p>
          }
        >
          <section className="kaart">
            {vakken.map((v) => (
              <Invoerrij key={v.vak.code} label={v.vak.naam} voor={`examen-${v.vak.code}`}>
                <select
                  id={`examen-${v.vak.code}`}
                  className="invoerrij__veld invoerrij__keuze"
                  value={soortVan(v, keuzes, niveau)}
                  onChange={(e) => kies(v.vak.code, e.target.value as ExamenSoort)}
                >
                  {soorten(niveau).map((s) => (
                    <option key={s.waarde} value={s.waarde}>
                      {s.tekst}
                    </option>
                  ))}
                </select>
              </Invoerrij>
            ))}
          </section>
        </Sectie>
      )}
    </div>
  );
}
