import { Capacitor } from '@capacitor/core';
import type { Afspraak } from '../api';
import { naarInvoer, nlTijd, plusDagen } from './datum';
import { metHoofdletter, htmlNaarTekst } from './tekst';

// Exporteren naar een agenda-app (Apple Agenda, Google Agenda …) als .ics-bestand.
// Het bestand is een momentopname: latere roosterwijzigingen komen er niet vanzelf in.

/** Komma's, puntkomma's, backslashes en regeleinden zoals .ics ze wil. */
const ontsnap = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** "20261110T072500Z": het moment in UTC. */
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** "20261110": een datum zonder tijd (hele-dag-afspraken), in Nederlandse tijd. */
const datum = (d: Date) => {
  const n = nlTijd(d);
  return `${n.jaar}${String(n.maand + 1).padStart(2, '0')}${String(n.dag).padStart(2, '0')}`;
};

/** Regels langer dan 75 tekens worden afgebroken, met een spatie aan het begin van het vervolg. */
function vouw(regel: string): string {
  const delen: string[] = [];
  let rest = regel;
  while (rest.length > 74) {
    delen.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  delen.push(rest);
  return delen.join('\r\n ');
}

/** De titel zoals in de Agenda: bij Modern de vaknaam, bij Klassiek de omschrijving van school. */
export function titelVan(a: Afspraak, modern: boolean): string {
  if (modern && a.vak && !a.labels.includes('eigen')) return metHoofdletter(a.vak);
  return a.omschrijving;
}

/**
 * Een .ics-bestand met deze afspraken: titel, lokaal als locatie en de tekst van de docent als notitie,
 * één op één overgenomen. Vervallen uren gaan er niet in.
 */
export function maakIcs(afspraken: Afspraak[], modern: boolean): { tekst: string; aantal: number } {
  const nu = utc(new Date().toISOString());
  const mee = afspraken.filter((a) => !a.labels.includes('vervalt'));
  const regels = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Klas+//Rooster//NL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const a of mee) {
    regels.push('BEGIN:VEVENT', `UID:${a.id.replace(/[^A-Za-z0-9_.-]/g, '-')}@klasplus`, `DTSTAMP:${nu}`);
    if (a.heleDag) {
      const begin = new Date(a.start);
      // Bij een hele dag is het einde het begin van de dag erna; minstens één dag.
      const einde = new Date(a.einde) > begin ? new Date(a.einde) : plusDagen(begin, 1);
      regels.push(`DTSTART;VALUE=DATE:${datum(begin)}`, `DTEND;VALUE=DATE:${datum(einde)}`);
    } else {
      regels.push(`DTSTART:${utc(a.start)}`, `DTEND:${utc(a.einde)}`);
    }
    regels.push(`SUMMARY:${ontsnap(titelVan(a, modern))}`);
    if (a.lokaal) regels.push(`LOCATION:${ontsnap(a.lokaal)}`);
    const notitie = a.inhoudHtml ? htmlNaarTekst(a.inhoudHtml).trim() : '';
    if (notitie) regels.push(`DESCRIPTION:${ontsnap(notitie)}`);
    regels.push('END:VEVENT');
  }
  regels.push('END:VCALENDAR');
  return { tekst: regels.map(vouw).join('\r\n') + '\r\n', aantal: mee.length };
}

/** "klasplus-rooster-2026-11-09-tot-2026-11-13.ics" */
export const bestandsnaam = (van: Date, tot: Date) => `klasplus-rooster-${naarInvoer(van)}-tot-${naarInvoer(tot)}.ics`;

/**
 * Geeft het bestand aan de telefoon. Op iPhone opent het voorbeeld, met "Voeg alles toe" voor Agenda;
 * op Android de agenda-app. In de browser (demo) wordt het gedownload.
 */
export async function openIcs(tekst: string, naam: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([tekst], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = naam;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return;
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { FileOpener } = await import('@capacitor-community/file-opener');
  const { uri } = await Filesystem.writeFile({ path: naam, data: tekst, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await FileOpener.open({ filePath: uri, contentType: 'text/calendar' });
}
