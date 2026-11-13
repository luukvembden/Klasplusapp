import { useMemo, useState } from 'react';
import { LaadKaart } from '../components/ui/Laden';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { useCijfers } from '../hooks/useCijfers';
import { perVak } from '../lib/cijfers';
import { bewaarKeuzes, leesKeuzes, soortVan, standaardSoort } from '../lib/examen';
import '../components/ui/ui.css';
import '../components/instellingen/instellingen.css';

/**
 * Bij Slaag ik? (tandwieltje): per vak aan- of uitzetten of het een centraal examen heeft. Uit betekent dat
 * het in het combinatiecijfer telt. Klas+ vult het zelf in; jij kijkt het na. Vakken die nooit meetellen
 * (lichamelijke opvoeding, mentoruur) staan er niet bij.
 */
export function ExamenVakken() {
  const { cijfers } = useCijfers();
  const vakken = useMemo(
    () => (cijfers ? perVak(cijfers).filter((v) => standaardSoort(v.vak.naam) !== 'niet') : []),
    [cijfers],
  );
  const [keuzes, setKeuzes] = useState(leesKeuzes);

  const zet = (code: string, ce: boolean) => {
    const nieuw = { ...keuzes, [code]: ce ? ('ce' as const) : ('combi' as const) };
    setKeuzes(nieuw);
    bewaarKeuzes(nieuw);
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers/slaag-ik" label="Slaag ik?" />
        <PaginaKop sub="Hoe elk vak meetelt" titel="Mijn vakken" />
      </VasteKop>
      {!cijfers && <LaadKaart rijen={6} />}
      {cijfers && vakken.length === 0 && <p className="melding">Nog geen vakken met cijfers.</p>}
      {vakken.length > 0 && (
        <Sectie
          titel="Centraal examen"
          nawoord={
            <p className="instellingen__let-op">
              Zet uit bij vakken zonder centraal examen, zoals maatschappijleer en het profielwerkstuk. Die tellen samen
              als één combinatiecijfer.
            </p>
          }
        >
          <section className="kaart">
            {vakken.map((v) => (
              <label key={v.vak.code} className="instelrij meldingrij" htmlFor={`examen-${v.vak.code}`}>
                <span className="meldingrij__tekst">
                  <span>{v.vak.naam}</span>
                </span>
                <input
                  id={`examen-${v.vak.code}`}
                  type="checkbox"
                  role="switch"
                  checked={soortVan(v, keuzes) === 'ce'}
                  onChange={(e) => zet(v.vak.code, e.target.checked)}
                />
              </label>
            ))}
          </section>
        </Sectie>
      )}
    </div>
  );
}
