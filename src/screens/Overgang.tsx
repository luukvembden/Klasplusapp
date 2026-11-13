import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Invoerrij } from "../components/les/Invoerrij";
import { OfflineRegel } from "../components/ui/OfflineRegel";
import { PaginaKop } from "../components/ui/PaginaKop";
import { Sectie } from "../components/ui/Sectie";
import { TerugLink } from "../components/ui/TerugLink";
import { VasteKop } from "../components/ui/VasteKop";
import { useCijfers } from "../hooks/useCijfers";
import { formatCijfer, perVak } from "../lib/cijfers";
import {
  bereken,
  bewaarNormen,
  leesNormen,
  type Compensatie,
  type Normen,
} from "../lib/overgang";
import "../components/les/les.css";
import "../components/ui/ui.css";
import "../components/cijfers/cijfers.css";
import "../components/instellingen/instellingen.css";
import { LaadKaart } from "../components/ui/Laden";

const COMPENSATIE: { waarde: Compensatie; tekst: string }[] = [
  { waarde: "gemiddelde", tekst: "Gemiddelde 6,0" },
  { waarde: "punten", tekst: "Pluspunten" },
  { waarde: "geen", tekst: "Niet toegestaan" },
];

/** Een keuzelijst met getallen, rechts in een invoerrij. */
function Getal({
  id,
  waarde,
  van,
  tot,
  onKies,
}: {
  id: string;
  waarde: number;
  van: number;
  tot: number;
  onKies: (n: number) => void;
}) {
  return (
    <select
      id={id}
      className="invoerrij__veld"
      value={waarde}
      onChange={(e) => onKies(Number(e.target.value))}
    >
      {Array.from({ length: tot - van + 1 }, (_, i) => van + i).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

/**
 * Overgangscheck: ga je over met je gemiddeldes van nu? De normen vult de leerling zelf in
 * (ze verschillen per school); ze blijven op dit toestel bewaard.
 */
export function Overgang() {
  const { cijfers, resultaat, fout } = useCijfers();
  const vakken = useMemo(() => (cijfers ? perVak(cijfers) : []), [cijfers]);
  const [normen, setNormen] = useState<Normen>(leesNormen);

  const wijzig = (deel: Partial<Normen>) => {
    const nieuw = { ...normen, ...deel };
    setNormen(nieuw);
    bewaarNormen(nieuw);
  };

  const uitslag = cijfers ? bereken(vakken, normen) : null;

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers/gemiddeldes" label="Gemiddeldes" />
        <PaginaKop sub="Met je gemiddeldes van nu" titel="Overgangscheck" />
      </VasteKop>
      <OfflineRegel resultaat={resultaat} />
      {fout && <p className="melding">{fout}</p>}
      {!cijfers && !fout && <LaadKaart rijen={6} />}

      {uitslag && uitslag.vakken.length === 0 && (
        <p className="melding">Nog geen cijfers om mee te rekenen.</p>
      )}

      {uitslag && uitslag.vakken.length > 0 && (
        <>
          <section
            className={`kaart overgang__uitslag${
              uitslag.bevorderd ? "" : " overgang__uitslag--niet"
            }`}
            role="status"
          >
            <div className="overgang__kop">
              {uitslag.bevorderd ? (
                <CircleCheck size={24} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <CircleAlert size={24} strokeWidth={2.4} aria-hidden="true" />
              )}
              <span>
                {uitslag.bevorderd
                  ? "Je gaat nu over"
                  : "Je gaat nu nog niet over"}
              </span>
            </div>
            {uitslag.bevorderd ? (
              <p className="overgang__tekst">{uitslag.samenvatting}</p>
            ) : (
              <ul className="overgang__redenen">
                {uitslag.redenen.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </section>

          <Sectie titel="Rapportcijfers">
            <section className="kaart">
              {uitslag.vakken.map((v) => (
                <div key={v.overzicht.vak.code} className="overgang__vak">
                  <span className="overgang__naam">
                    {v.overzicht.vak.naam}
                  </span>
                  <span className="overgang__gem">
                    {formatCijfer(v.gemiddelde)}
                  </span>
                  <span
                    className={`overgang__rapport${
                      v.tekort ? " overgang__rapport--onv" : ""
                    }`}
                  >
                    {v.rapport}
                  </span>
                  <span
                    className={`overgang__punten${
                      v.tekort
                        ? " overgang__punten--min"
                        : v.plus
                        ? " overgang__punten--plus"
                        : ""
                    }`}
                  >
                    {v.tekort ? `−${v.tekort}` : v.plus ? `+${v.plus}` : ""}
                  </span>
                </div>
              ))}
            </section>
          </Sectie>

          <Sectie
            titel="Normen van je school"
            nawoord={
              <p className="instellingen__let-op">
                Overgangsnormen verschillen per school; je vindt ze meestal in
                de schoolgids. Compensatie is hoe je onvoldoendes mag goedmaken:
                met een gemiddelde van minstens 6,0, of met evenveel pluspunten
                (een 7 is +1). Dit is een schatting met je gemiddeldes van nu;
                je school beslist.
              </p>
            }
          >
            <section className="kaart">
              <Invoerrij label="Tekortpunten hoogstens" voor="norm-tekort">
                <Getal
                  id="norm-tekort"
                  waarde={normen.maxTekort}
                  van={0}
                  tot={6}
                  onKies={(n) => wijzig({ maxTekort: n })}
                />
              </Invoerrij>
              <Invoerrij label="Laagste cijfer dat mag" voor="norm-laagste">
                <Getal
                  id="norm-laagste"
                  waarde={normen.laagste}
                  van={1}
                  tot={6}
                  onKies={(n) => wijzig({ laagste: n })}
                />
              </Invoerrij>
              <Invoerrij label="Compensatie" voor="norm-compensatie">
                <select
                  id="norm-compensatie"
                  className="invoerrij__veld"
                  value={normen.compensatie}
                  onChange={(e) =>
                    wijzig({ compensatie: e.target.value as Compensatie })
                  }
                >
                  {COMPENSATIE.map((c) => (
                    <option key={c.waarde} value={c.waarde}>
                      {c.tekst}
                    </option>
                  ))}
                </select>
              </Invoerrij>
            </section>
          </Sectie>

        </>
      )}
    </div>
  );
}
