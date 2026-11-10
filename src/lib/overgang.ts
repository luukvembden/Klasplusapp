import type { VakOverzicht } from "./cijfers";
import { lees, schrijf } from "./opslag";

/** Hoe een school pluspunten laat meetellen tegen tekortpunten. */
export type Compensatie = "geen" | "gemiddelde" | "punten";

/** De bevorderingsnormen zoals de leerling ze van school overneemt. */
export interface Normen {
  /** Hoeveel tekortpunten je in totaal mag hebben. */
  maxTekort: number;
  /** Het laagste rapportcijfer dat nog mag (een 3 is vaak meteen niet bevorderd). */
  laagste: number;
  compensatie: Compensatie;
}

export const STANDAARD_NORMEN: Normen = {
  maxTekort: 2,
  laagste: 4,
  compensatie: "gemiddelde",
};

const SLEUTEL = "overgang.normen";

export function leesNormen(): Normen {
  const bewaard = lees<Partial<Normen>>(SLEUTEL) ?? {};
  return {
    maxTekort: bewaard.maxTekort ?? STANDAARD_NORMEN.maxTekort,
    laagste: bewaard.laagste ?? STANDAARD_NORMEN.laagste,
    compensatie: bewaard.compensatie ?? STANDAARD_NORMEN.compensatie,
  };
}

export const bewaarNormen = (n: Normen) => schrijf(SLEUTEL, n);

/** Rapportcijfer: afronden op een heel getal, 5,5 wordt een 6. */
export const rapportcijfer = (gemiddelde: number) =>
  Math.floor(gemiddelde + 0.5);

export interface VakStand {
  overzicht: VakOverzicht;
  gemiddelde: number;
  rapport: number;
  /** 6 − rapportcijfer, als dat lager is dan een 6. */
  tekort: number;
  /** Rapportcijfer − 6, als dat hoger is. */
  plus: number;
}

export interface Uitslag {
  vakken: VakStand[];
  bevorderd: boolean;
  /** Waarom niet, in gewone zinnen. Leeg als je bevorderd bent. */
  redenen: string[];
  /** Wat er goed gaat, kort. */
  samenvatting: string;
  tekort: number;
  plus: number;
  gemiddeldeRapport: number | null;
}

const punten = (n: number) => (n === 1 ? "1 tekortpunt" : `${n} tekortpunten`);
const komma = (n: number) => n.toFixed(1).replace(".", ",");

/** Rekent uit of je met je huidige gemiddeldes over zou gaan volgens de ingevulde normen. */
export function bereken(vakken: VakOverzicht[], normen: Normen): Uitslag {
  const standen: VakStand[] = vakken
    .filter(
      (o): o is VakOverzicht & { gemiddelde: number } => o.gemiddelde !== null
    )
    .map((o) => {
      const rapport = rapportcijfer(o.gemiddelde);
      return {
        overzicht: o,
        gemiddelde: o.gemiddelde,
        rapport,
        tekort: Math.max(0, 6 - rapport),
        plus: Math.max(0, rapport - 6),
      };
    });

  const tekort = standen.reduce((s, v) => s + v.tekort, 0);
  const plus = standen.reduce((s, v) => s + v.plus, 0);
  const gemiddeldeRapport = standen.length
    ? standen.reduce((s, v) => s + v.rapport, 0) / standen.length
    : null;

  const redenen: string[] = [];
  const telaag = standen.filter((v) => v.rapport < normen.laagste);
  for (const v of telaag)
    redenen.push(
      `${v.overzicht.vak.naam} staat op een ${v.rapport}; lager dan een ${normen.laagste} mag niet.`
    );
  if (tekort > normen.maxTekort)
    redenen.push(
      normen.maxTekort === 0
        ? `Je hebt ${punten(tekort)}, en dat mag niet.`
        : `Je hebt ${punten(tekort)}; er mogen er hoogstens ${normen.maxTekort}.`
    );
  if (
    tekort > 0 &&
    normen.compensatie === "gemiddelde" &&
    gemiddeldeRapport !== null &&
    gemiddeldeRapport < 6
  )
    redenen.push(
      `Je gemiddelde rapportcijfer is ${komma(
        gemiddeldeRapport
      )}; met tekortpunten moet dat minstens 6,0 zijn.`
    );
  if (tekort > 0 && normen.compensatie === "punten" && plus < tekort)
    redenen.push(
      `Je hebt ${plus} pluspunten tegenover ${punten(
        tekort
      )}; dat moet minstens gelijk zijn.`
    );
  if (tekort > 0 && normen.compensatie === "geen")
    redenen.push(
      `Je school laat geen onvoldoendes toe, en je hebt ${punten(tekort)}.`
    );

  const samenvatting =
    tekort === 0
      ? "Geen enkele onvoldoende op je rapport."
      : `${punten(tekort)}, binnen de normen van je school.`;

  return {
    vakken: standen,
    bevorderd: redenen.length === 0,
    redenen,
    samenvatting,
    tekort,
    plus,
    gemiddeldeRapport,
  };
}
