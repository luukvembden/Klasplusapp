import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ExamenjaarKeuze } from '../components/cijfers/ExamenjaarKeuze';
import { Invoerrij } from '../components/les/Invoerrij';
import { LaadKaart } from '../components/ui/Laden';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { useCijfers } from '../hooks/useCijfers';
import { perVak } from '../lib/cijfers';
import { bewaarKeuzes, examenNiveau, isVmbo, leesKeuzes, soortVan, type ExamenSoort, type Niveau } from '../lib/examen';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/instellingen/instellingen.css';

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

  // Zet je het examenjaar op "geen", dan hoort hier de overgangscheck.
  if (profiel && !niveau) return <Navigate to="/cijfers/overgang" replace />;

  const kies = (code: string, soort: ExamenSoort) => {
    const nieuw = { ...keuzes, [code]: soort };
    setKeuzes(nieuw);
    bewaarKeuzes(nieuw);
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers/examen" label="Examencheck" />
        <PaginaKop sub="Hoe elk vak meetelt" titel="Mijn vakken" />
      </VasteKop>
      <ExamenjaarKeuze profiel={profiel} onWijzig={() => ververs((n) => n + 1)} />
      {!cijfers && <LaadKaart rijen={6} />}
      {cijfers && vakken.length === 0 && <p className="melding">Nog geen vakken met cijfers.</p>}
      {niveau && vakken.length > 0 && (
        <Sectie
          titel="Per vak"
          nawoord={
            <p className="instellingen__let-op">
              {isVmbo(niveau)
                ? niveau === 'gl'
                  ? 'Het profielvak en de beroepsgerichte keuzevakken vormen samen het combinatiecijfer; het profielvak telt daarin zo vaak mee als je keuzevakken hebt. Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding, kunstvakken en het profielwerkstuk krijgen een voldoende of goed en tellen niet mee in de cijfers.'
                  : niveau === 'tl'
                    ? 'Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding, kunstvakken en het profielwerkstuk krijgen een voldoende of goed en tellen niet mee in de cijfers.'
                    : 'Je beroepsgerichte keuzevakken vormen samen het combinatiecijfer. Maatschappijleer heeft alleen een schoolexamen. Lichamelijke opvoeding en kunstvakken krijgen een voldoende of goed en tellen niet mee in de cijfers.'
                : 'Maatschappijleer, CKV en het profielwerkstuk vormen samen het combinatiecijfer. Vakken als informatica hebben alleen een schoolexamen. Lichamelijke opvoeding telt niet mee in de cijfers.'}
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
