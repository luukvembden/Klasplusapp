import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { CircleAlert, CircleCheck, Settings } from "lucide-react";
import { OfflineRegel } from "../components/ui/OfflineRegel";
import { PaginaKop } from "../components/ui/PaginaKop";
import { Sectie } from "../components/ui/Sectie";
import { TerugLink } from "../components/ui/TerugLink";
import { VasteKop } from "../components/ui/VasteKop";
import { useCijfers } from "../hooks/useCijfers";
import { formatCijfer, perVak } from "../lib/cijfers";
import { isExamenjaar } from "../lib/examen";
import { bereken, leesNormen } from "../lib/overgang";
import "../components/les/les.css";
import "../components/ui/ui.css";
import "../components/agenda/agenda.css";
import "../components/cijfers/cijfers.css";
import "../components/instellingen/instellingen.css";
import { LaadKaart } from "../components/ui/Laden";

/**
 * Overgangscheck: ga je over met je gemiddeldes van nu? De normen vult de leerling zelf in
 * (ze verschillen per school); ze blijven op dit toestel bewaard.
 */
export function Overgang() {
  const { cijfers, profiel, resultaat, fout } = useCijfers();
  const vakken = useMemo(() => (cijfers ? perVak(cijfers) : []), [cijfers]);
  const normen = leesNormen();
  const examen = isExamenjaar(profiel?.klas);

  const uitslag = cijfers ? bereken(vakken, normen) : null;

  // In het examenjaar is er geen overgang: dan de Examencheck
  if (examen) return <Navigate to="/cijfers/examen" replace />;

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers/gemiddeldes" label="Gemiddeldes" />
        {/* Tandwieltje rechtsboven: de normen van je school invullen. */}
        <Link to="/cijfers/overgang/normen" className="agendakop__vandaag gemiddeldes__knop tandwielknop" aria-label="Normen van je school">
          <Settings size={20} strokeWidth={2.2} aria-hidden="true" />
        </Link>
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


        </>
      )}
    </div>
  );
}
