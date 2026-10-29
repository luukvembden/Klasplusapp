// Datumhulpjes met vaste Nederlandse namen, zodat de weergave op elk toestel gelijk is.
// Alles rekent in Nederlandse tijd (met zomer- en wintertijd), wat de tijdzone van het toestel ook is:
// een les om 13:00 staat zo altijd op 13:00, net als in de officiële app.

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const tweeCijfers = (n: number) => String(n).padStart(2, '0');
const hoofdletter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TIJDZONE = 'Europe/Amsterdam';

const delenFormaat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIJDZONE,
  hourCycle: 'h23',
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});
const WEEKDAGEN_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Hoe een moment er in Nederland uitziet. `maand` telt vanaf 0, `weekdag` 0 is zondag. */
export interface NlTijd {
  jaar: number;
  maand: number;
  dag: number;
  uur: number;
  minuut: number;
  seconde: number;
  weekdag: number;
}

// Dezelfde momenten komen bij elke render terug; onthouden scheelt rekenwerk.
const onthouden = new Map<number, NlTijd>();

export function nlTijd(d: Date): NlTijd {
  const t = d.getTime();
  const bekend = onthouden.get(t);
  if (bekend) return bekend;
  const deel: Record<string, string> = {};
  for (const p of delenFormaat.formatToParts(d)) deel[p.type] = p.value;
  const uit: NlTijd = {
    jaar: Number(deel.year),
    maand: Number(deel.month) - 1,
    dag: Number(deel.day),
    uur: Number(deel.hour),
    minuut: Number(deel.minute),
    seconde: Number(deel.second),
    weekdag: WEEKDAGEN_EN.indexOf(deel.weekday),
  };
  if (onthouden.size > 2000) onthouden.clear();
  onthouden.set(t, uit);
  return uit;
}

/** Hoeveel ms Nederland op moment `t` voorloopt op UTC (1 of 2 uur). */
function voorsprong(t: number): number {
  const n = nlTijd(new Date(t));
  return Date.UTC(n.jaar, n.maand, n.dag, n.uur, n.minuut, n.seconde) - Math.floor(t / 1000) * 1000;
}

/** Het moment waarop de klok in Nederland deze datum en tijd aanwijst. Te grote dagen lopen door. */
export function nlMoment(jaar: number, maand: number, dag: number, uur = 0, minuut = 0, seconde = 0): Date {
  const alsUtc = Date.UTC(jaar, maand, dag, uur, minuut, seconde);
  // Twee keer, zodat het ook klopt rond de wissel van zomer- naar wintertijd.
  const gok = alsUtc - voorsprong(alsUtc);
  return new Date(alsUtc - voorsprong(gok));
}

export function beginVanDag(d: Date): Date {
  const n = nlTijd(d);
  return nlMoment(n.jaar, n.maand, n.dag);
}

export function plusDagen(d: Date, aantal: number): Date {
  const n = nlTijd(d);
  return nlMoment(n.jaar, n.maand, n.dag + aantal, n.uur, n.minuut, n.seconde);
}

/** Maandag van de week waarin `d` valt. */
export function maandagVan(d: Date): Date {
  return plusDagen(beginVanDag(d), -((nlTijd(d).weekdag + 6) % 7));
}

export function zelfdeDag(a: Date, b: Date): boolean {
  return naarInvoer(a) === naarInvoer(b);
}

/** Valt `d` op maandag t/m vrijdag? */
export function isWeekdag(d: Date): boolean {
  const w = nlTijd(d).weekdag;
  return w >= 1 && w <= 5;
}

/** "Dinsdag 27 oktober" */
export function dagTitel(d: Date): string {
  const n = nlTijd(d);
  return `${hoofdletter(DAGEN[n.weekdag])} ${n.dag} ${MAANDEN[n.maand]}`;
}

/** "Vrijdag" */
export function dagNaam(d: Date): string {
  return hoofdletter(DAGEN[nlTijd(d).weekdag]);
}

/** "woensdag 28 oktober" (zonder hoofdletter, voor in een zin of onderregel) */
export function datumInZin(d: Date): string {
  const n = nlTijd(d);
  return `${DAGEN[n.weekdag]} ${n.dag} ${MAANDEN[n.maand]}`;
}

/** "28 oktober" */
export function dagEnMaand(d: Date): string {
  const n = nlTijd(d);
  return `${n.dag} ${MAANDEN[n.maand]}`;
}

/** "Oktober", of "Oktober 2025" als het niet dit jaar is. */
export function maandTitel(d: Date): string {
  const n = nlTijd(d);
  const maand = hoofdletter(MAANDEN[n.maand]);
  return n.jaar === nlTijd(new Date()).jaar ? maand : `${maand} ${n.jaar}`;
}

/** "di" */
export function dagKort(d: Date): string {
  return DAGEN_KORT[nlTijd(d).weekdag];
}

/** "08:25" */
export function tijd(d: Date): string {
  const n = nlTijd(d);
  return `${tweeCijfers(n.uur)}:${tweeCijfers(n.minuut)}`;
}

/** "08:25 – 09:15" */
export function tijdvak(start: string, einde: string): string {
  return `${tijd(new Date(start))} – ${tijd(new Date(einde))}`;
}

/** "26 okt" */
export function korteDatum(iso: string): string {
  const n = nlTijd(new Date(iso));
  return `${n.dag} ${MAANDEN_KORT[n.maand]}`;
}

/** ISO-weeknummer (week 1 bevat de eerste donderdag van het jaar), zoals scholen het gebruiken. */
export function weekNummer(d: Date): number {
  const n = nlTijd(plusDagen(maandagVan(d), 3));
  const dagVanJaar = (Date.UTC(n.jaar, n.maand, n.dag) - Date.UTC(n.jaar, 0, 1)) / 86_400_000;
  return Math.floor(dagVanJaar / 7) + 1;
}

/** "26 okt – 1 nov" voor de week waarin `d` valt. */
export function weekBereik(d: Date): string {
  const ma = nlTijd(maandagVan(d));
  const zo = nlTijd(plusDagen(maandagVan(d), 6));
  return `${ma.dag} ${MAANDEN_KORT[ma.maand]} – ${zo.dag} ${MAANDEN_KORT[zo.maand]}`;
}

/** "28 okt om 09:10" */
export function korteDatumTijd(iso: string): string {
  const d = new Date(iso);
  const n = nlTijd(d);
  return `${n.dag} ${MAANDEN_KORT[n.maand]} om ${tijd(d)}`;
}

/** "27 oktober 2026 om 14:03" */
export function datumEnTijd(iso: string): string {
  const d = new Date(iso);
  const n = nlTijd(d);
  return `${n.dag} ${MAANDEN[n.maand]} ${n.jaar} om ${tijd(d)}`;
}

/** "27-10 om 07:45" */
export function bijgewerkt(iso: string): string {
  const d = new Date(iso);
  const n = nlTijd(d);
  return `${tweeCijfers(n.dag)}-${tweeCijfers(n.maand + 1)} om ${tijd(d)}`;
}

/** Datum als "2026-10-27", voor een datumveld. */
export function naarInvoer(d: Date): string {
  const n = nlTijd(d);
  return `${n.jaar}-${tweeCijfers(n.maand + 1)}-${tweeCijfers(n.dag)}`;
}

export function vanInvoer(waarde: string): Date | null {
  const [j, m, d] = waarde.split('-').map(Number);
  return j && m && d ? nlMoment(j, m - 1, d) : null;
}
