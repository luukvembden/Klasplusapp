import { beginVanDag, vanInvoer } from './datum';

// Schoolvakanties zoals de overheid ze vastlegt (rijksoverheid.nl, open data), per regio.
// Scholen hebben soms nog eigen vrije dagen; die kent Klas+ niet.

export type Regio = 'noord' | 'midden' | 'zuid';

interface Vakantie {
  naam: string;
  /** Eerste en laatste vrije dag (zaterdag t/m zondag), "YYYY-MM-DD". */
  van: string;
  tot: string;
  /** Leeg: in heel Nederland tegelijk. */
  regio?: Regio;
}

const VAKANTIES: Vakantie[] = [
  // 2026-2027
  { naam: 'Herfstvakantie', van: '2026-10-10', tot: '2026-10-18', regio: 'noord' },
  { naam: 'Herfstvakantie', van: '2026-10-17', tot: '2026-10-25', regio: 'midden' },
  { naam: 'Herfstvakantie', van: '2026-10-17', tot: '2026-10-25', regio: 'zuid' },
  { naam: 'Kerstvakantie', van: '2026-12-19', tot: '2027-01-03' },
  { naam: 'Voorjaarsvakantie', van: '2027-02-20', tot: '2027-02-28', regio: 'noord' },
  { naam: 'Voorjaarsvakantie', van: '2027-02-20', tot: '2027-02-28', regio: 'midden' },
  { naam: 'Voorjaarsvakantie', van: '2027-02-13', tot: '2027-02-21', regio: 'zuid' },
  { naam: 'Meivakantie', van: '2027-04-24', tot: '2027-05-02' },
  { naam: 'Zomervakantie', van: '2027-07-10', tot: '2027-08-22', regio: 'noord' },
  { naam: 'Zomervakantie', van: '2027-07-17', tot: '2027-08-29', regio: 'midden' },
  { naam: 'Zomervakantie', van: '2027-07-24', tot: '2027-09-05', regio: 'zuid' },
  // 2027-2028
  { naam: 'Herfstvakantie', van: '2027-10-16', tot: '2027-10-24', regio: 'noord' },
  { naam: 'Herfstvakantie', van: '2027-10-16', tot: '2027-10-24', regio: 'midden' },
  { naam: 'Herfstvakantie', van: '2027-10-23', tot: '2027-10-31', regio: 'zuid' },
  { naam: 'Kerstvakantie', van: '2027-12-25', tot: '2028-01-09' },
  { naam: 'Voorjaarsvakantie', van: '2028-02-19', tot: '2028-02-27', regio: 'noord' },
  { naam: 'Voorjaarsvakantie', van: '2028-02-26', tot: '2028-03-05', regio: 'midden' },
  { naam: 'Voorjaarsvakantie', van: '2028-02-26', tot: '2028-03-05', regio: 'zuid' },
  { naam: 'Meivakantie', van: '2028-04-29', tot: '2028-05-07' },
  { naam: 'Zomervakantie', van: '2028-07-15', tot: '2028-08-27', regio: 'noord' },
  { naam: 'Zomervakantie', van: '2028-07-08', tot: '2028-08-20', regio: 'midden' },
  { naam: 'Zomervakantie', van: '2028-07-22', tot: '2028-09-03', regio: 'zuid' },
];

/** "kerstvakantie" midden in een zin. */
const klein = (naam: string) => naam.charAt(0).toLowerCase() + naam.slice(1);

/**
 * Het regeltje onderin Meer: hoeveel dagen nog tot de volgende vakantie, of hoeveel dagen vrij je
 * nog hebt als het al vakantie is. Zonder gekozen regio alleen de vakanties van heel Nederland.
 */
export function vakantieRegel(regio: Regio | '', nu = new Date()): string | null {
  const vandaag = beginVanDag(nu);
  const lijst = VAKANTIES.filter((v) => !v.regio || v.regio === regio)
    .map((v) => ({ ...v, begin: vanInvoer(v.van)!, eind: vanInvoer(v.tot)! }))
    .sort((a, b) => a.begin.getTime() - b.begin.getTime());

  const nuVrij = lijst.find((v) => v.begin <= vandaag && vandaag <= v.eind);
  if (nuVrij) {
    const dagen = Math.round((nuVrij.eind.getTime() - vandaag.getTime()) / 86_400_000) + 1;
    return dagen === 1 ? `${nuVrij.naam}: vandaag de laatste dag vrij` : `${nuVrij.naam}: nog ${dagen} dagen vrij`;
  }

  const volgende = lijst.find((v) => v.begin > vandaag);
  if (!volgende) return null;
  // Gewone dagen tot de vakantie begint (de zaterdag waarop hij ingaat).
  const dagen = Math.round((volgende.begin.getTime() - vandaag.getTime()) / 86_400_000);
  return `Nog ${dagen} ${dagen === 1 ? 'dag' : 'dagen'} tot de ${klein(volgende.naam)}`;
}
