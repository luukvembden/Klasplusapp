// Verzoeken aan de schoolserver: token meesturen, op tijd vernieuwen en de limiet respecteren.
// In de telefoon-app gaat fetch via de native HTTP (CapacitorHttp), dus zonder CORS.
import { SESSIE_VERLOPEN } from '../SchoolApi';
import { bewaarTokens, leesTokens, TokenFout, vernieuwTokens, wisTokens, type Tokens } from './auth';

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
    // Op Android kan de ochtendmelding (OchtendMelding.java) de sleutels al vernieuwd hebben terwijl de app
    // op de achtergrond stond. Dan is onze oude sleutel niet meer geldig: eerst de bewaarde nemen.
    const bewaard = await leesTokens();
    if (bewaard && bewaard.refreshToken !== s.tokens.refreshToken) {
      s.tokens = bewaard;
      if (Date.now() < bewaard.verlooptOp) return;
    }
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

/**
 * Fout van de schoolserver. `uitleg` is wat de school zelf terugschrijft (zoals waarom een ziekmelding
 * niet mag), als dat gewone tekst is. Anders een korte Nederlandse zin; nooit "HTTP 400" op het scherm.
 */
export class SchoolFout extends Error {
  constructor(
    readonly status: number,
    readonly uitleg: string | null,
  ) {
    super(uitleg ?? standaardUitleg(status));
    this.name = 'SchoolFout';
  }
}

function standaardUitleg(status: number): string {
  if (status === 404) return 'Dit is niet (meer) te vinden bij school.';
  if (status === 403) return 'Dit mag je school niet via de app laten doen.';
  if (status >= 500) return 'De schoolserver doet het even niet. Probeer het later opnieuw.';
  return 'Dat lukte niet. Probeer het later opnieuw.';
}

/** Zoekt in het antwoord naar een uitleg in gewone taal ("omschrijving", "Message", …). */
function uitlegUit(tekst: string): string | null {
  let data: unknown;
  try {
    data = JSON.parse(tekst);
  } catch {
    return null;
  }
  const kandidaten: unknown[] = [];
  const zoek = (x: unknown, diepte: number) => {
    if (diepte > 3 || !x) return;
    if (typeof x === 'string') kandidaten.push(x);
    else if (Array.isArray(x)) x.forEach((y) => zoek(y, diepte + 1));
    else if (typeof x === 'object') {
      const o = x as Record<string, unknown>;
      for (const k of ['omschrijving', 'Omschrijving', 'message', 'Message', 'detail', 'Detail', 'errors', 'Errors', 'fouten'])
        zoek(o[k], diepte + 1);
    }
  };
  zoek(data, 0);
  // Alleen echte zinnen, geen technische meldingen als "Bad Request" of een foutcode.
  const zin = kandidaten
    .map((k) => String(k).trim())
    .find((k) => k.length > 3 && k.length < 300 && /\s/.test(k) && !/exception|bad request|error|^[A-Z_]+$/i.test(k));
  return zin ?? null;
}

const wacht = (ms: number) => new Promise((klaar) => setTimeout(klaar, ms));

type Methode = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
    const tekst = await antwoord.text().catch(() => '');
    throw new SchoolFout(antwoord.status, uitlegUit(tekst));
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
