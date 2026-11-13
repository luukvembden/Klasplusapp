import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExamenjaarKeuze } from "../components/cijfers/ExamenjaarKeuze";
import { useCijfers } from "../hooks/useCijfers";
import { Invoerrij } from "../components/les/Invoerrij";
import { PaginaKop } from "../components/ui/PaginaKop";
import { Sectie } from "../components/ui/Sectie";
import { TerugLink } from "../components/ui/TerugLink";
import { VasteKop } from "../components/ui/VasteKop";
import {
  bewaarNormen,
  leesNormen,
  type Compensatie,
  type Normen,
} from "../lib/overgang";
import "../components/les/les.css";
import "../components/ui/ui.css";
import "../components/instellingen/instellingen.css";

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

/** Bij de overgangscheck (tandwieltje): de normen van je school, bewaard op dit toestel. */
export function OvergangNormen() {
  const [normen, setNormen] = useState<Normen>(leesNormen);
  const { profiel } = useCijfers();
  const navigate = useNavigate();

  const wijzig = (deel: Partial<Normen>) => {
    const nieuw = { ...normen, ...deel };
    setNormen(nieuw);
    bewaarNormen(nieuw);
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers/overgang" label="Overgangscheck" />
        <PaginaKop sub="Zoals in je schoolgids" titel="Normen" />
      </VasteKop>
      {/* Zet je hier een examenjaar aan, dan ga je meteen naar de Examencheck. */}
      <ExamenjaarKeuze
        profiel={profiel}
        onWijzig={(k) => {
          if (k !== "geen") navigate("/cijfers/examen", { replace: true });
        }}
      />
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
    </div>
  );
}
