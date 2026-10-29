// Verzoeken aan de schoolserver: token meesturen, op tijd vernieuwen en de limiet respecteren.
// In de telefoon-app gaat fetch via de native HTTP (CapacitorHttp), dus zonder CORS.
import { SESSIE_VERLOPEN } from '../SchoolApi';
import { bewaarTokens, TokenFout, vernieuwTokens, wisTokens, type Tokens } from './auth';

export interface Sessie {
  tokens: Tokens;
  /** Bijvoorbeeld https://jouwschool.magister.net/ */
  schoolUrl: string;
  persoonId: number;
}

let sessie: Sessie | null = null;
let vernieuwen: Promise<void> | null = null;

export const huidigeSessie = () => sessie;

export function zetSessie(nieuw: Sessie | null) {
  sessie = nieuw;
}

async function bewaar(s: Sessie) {
  await bewaarTokens(s.tokens);
}

/** Eén keer tegelijk vernieuwen, ook als meerdere verzoeken tegelijk een verlopen token zien. */
async function vernieuw(): Promise<void> {
  vernieuwen ??= (async () => {
    const s = sessie;
    if (!s) throw new Error('Geen sessie');
    try {
      s.tokens = await vernieuwTokens(s.tokens);
      await bewaar(s);
    } catch (fout) {
      if (fout instanceof TokenFout && fout.sessieVoorbij) {
        sessie = null;
        await wisTokens();
        window.dispatchEvent(new Event(SESSIE_VERLOPEN));
      }
      throw fout;
    }
  })().finally(() => {
    vernieuwen = null;
  });
  return vernieuwen;
}

const wacht = (ms: number) => new Promise((klaar) => setTimeout(klaar, ms));

type Methode = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Verzoek aan de schoolserver; `pad` zonder beginnende slash, bijvoorbeeld "api/account".
 * Een volledig adres (https://…) gaat naar die server, zoals de afwezigheidsmodule.
 * Opnieuw proberen is veilig: bij 429 en 401 heeft de server het verzoek niet uitgevoerd.
 */
async function verzoek<T>(methode: Methode, pad: string, body?: unknown, poging = 0): Promise<T> {
  if (!sessie) throw new Error('Geen sessie');
  if (Date.now() > sessie.tokens.verlooptOp) await vernieuw();

  const adres = pad.startsWith('https://') ? pad : sessie.schoolUrl + pad;
  const antwoord = await fetch(adres, {
    method: methode,
    headers: {
      Authorization: `Bearer ${sessie.tokens.accessToken}`,
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Te veel verzoeken: de server zegt hoe lang we moeten wachten.
  if (antwoord.status === 429 && poging < 3) {
    const data = await antwoord.json().catch(() => ({}));
    await wacht(((data?.secondsLeft ?? 5) + 1) * 1000);
    return verzoek(methode, pad, body, poging + 1);
  }

  // Token ongeldig of verlopen: één keer vernieuwen en opnieuw proberen.
  if ((antwoord.status === 401 || antwoord.status === 403) && poging === 0) {
    const tekst = await antwoord.text().catch(() => '');
    if (antwoord.status === 401 || tekst.includes('SecurityToken Expired')) {
      await vernieuw();
      return verzoek(methode, pad, body, poging + 1);
    }
  }

  if (!antwoord.ok) {
    // Bij sommige fouten (zoals een ziekmelding die niet mag) legt de school in "omschrijving" uit waarom.
    const uitleg = await antwoord
      .json()
      .then((d: { omschrijving?: string }) => d?.omschrijving)
      .catch(() => undefined);
    throw new Error(uitleg || `HTTP ${antwoord.status} bij ${methode} ${pad.split('?')[0]}`);
  }
  // Opslaan en verwijderen geven soms een leeg antwoord.
  const tekst = await antwoord.text();
  return (tekst ? JSON.parse(tekst) : undefined) as T;
}

export const haal = <T>(pad: string) => verzoek<T>('GET', pad);
export const stuur = (methode: Exclude<Methode, 'GET'>, pad: string, body?: unknown) =>
  verzoek<unknown>(methode, pad, body);

/** Zoekt op bij welke schoolserver dit account hoort. */
export async function zoekSchoolUrl(accessToken: string): Promise<string> {
  const antwoord = await fetch('https://magister.net/.well-known/host-meta.json?rel=magister-api', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await antwoord.json()) as { links?: { href: string }[] };
  const href = data.links?.[0]?.href;
  if (!href) throw new Error('Schoolserver niet gevonden');
  return `https://${new URL(href).host}/`;
}
