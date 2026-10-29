// Inloggen bij het schoolsysteem met OAuth2 + PKCE, op dezelfde manier als de app Gemairo.
// Achtergrond en bronnen: docs/inloggen-onderzoek.md.
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { InloggenAfgebroken } from '../SchoolApi';

const ACCOUNTS = 'https://accounts.magister.net';
const CLIENT_ID = 'M6LOAPP';
const REDIRECT_URI = 'm6loapp://oauth2redirect/';
// attendance.*: de nieuwe afwezigheidsmodule (redenen, meldingen). De officiële app mag deze ook vragen.
const SCOPE =
  'openid profile offline_access magister.mobile magister.ecs attendance.overview attendance.administration';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  /** Tijdstip (ms) waarop het access token verloopt. */
  verlooptOp: number;
}

// ---- Opslag in de Keychain (iOS) of Keystore (Android) ----

const TOKEN_SLEUTEL = 'tokens';

export async function leesTokens(): Promise<Tokens | null> {
  try {
    return (await SecureStorage.get(TOKEN_SLEUTEL, false)) as Tokens | null;
  } catch {
    return null;
  }
}

export async function bewaarTokens(tokens: Tokens): Promise<void> {
  await SecureStorage.set(TOKEN_SLEUTEL, tokens as unknown as Record<string, string>, false);
}

export async function wisTokens(): Promise<void> {
  await SecureStorage.remove(TOKEN_SLEUTEL).catch(() => false);
}

// ---- PKCE ----

function willekeurig(bytes: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function codeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

export function inlogUrl(challenge: string, state: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    response_type: 'code id_token',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${ACCOUNTS}/connect/authorize?${params}`;
}

/** Haalt code en state uit m6loapp://oauth2redirect/#code=…&state=… (of met ? in plaats van #). */
export function leesTerugsturing(url: string): { code?: string; state?: string; fout?: string } {
  const deel = url.split(/[#?]/).slice(1).join('&');
  const p = new URLSearchParams(deel);
  return { code: p.get('code') ?? undefined, state: p.get('state') ?? undefined, fout: p.get('error') ?? undefined };
}

// ---- De inlogpagina in een in-app browser ----

/** Opent de inlogpagina en wacht tot die terugstuurt naar m6loapp://. Geeft die URL terug. */
function openInlogpagina(url: string): Promise<string> {
  const browser = window.cordova?.InAppBrowser;
  if (!browser) return Promise.reject(new Error('In-app browser niet beschikbaar'));

  return new Promise((klaar, mislukt) => {
    let afgerond = false;
    const venster = browser.open(
      url,
      '_blank',
      // Schone sessie (geen oude cookies), Nederlandse knop, geen adresbalk.
      'location=no,clearcache=yes,clearsessioncache=yes,cleardata=yes,toolbarposition=top,' +
        'closebuttoncaption=Annuleren,hidenavigationbuttons=yes,hideurlbar=yes,zoom=no',
    );
    venster.addEventListener('customscheme', (e) => {
      if (!e.url?.startsWith('m6loapp:')) return;
      afgerond = true;
      venster.close();
      klaar(e.url);
    });
    venster.addEventListener('exit', () => {
      if (!afgerond) mislukt(new InloggenAfgebroken());
    });
  });
}

// ---- Tokens ophalen en vernieuwen ----

interface TokenAntwoord {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in?: number;
}

async function tokenVerzoek(velden: Record<string, string>): Promise<TokenAntwoord> {
  const antwoord = await fetch(`${ACCOUNTS}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...velden }).toString(),
  });
  const data = await antwoord.json().catch(() => ({}));
  if (!antwoord.ok) throw new TokenFout(data?.error ?? `HTTP ${antwoord.status}`);
  return data as TokenAntwoord;
}

export class TokenFout extends Error {
  /** invalid_grant / invalid_request: de sessie is niet meer geldig, opnieuw inloggen. */
  get sessieVoorbij() {
    return this.message === 'invalid_grant' || this.message === 'invalid_request';
  }
}

function naarTokens(a: TokenAntwoord, oud?: Tokens): Tokens {
  return {
    accessToken: a.access_token,
    refreshToken: a.refresh_token ?? oud?.refreshToken,
    idToken: a.id_token ?? oud?.idToken,
    // Een minuut marge, zodat een verzoek niet net met een verlopen token vertrekt.
    verlooptOp: Date.now() + ((a.expires_in ?? 3600) - 60) * 1000,
  };
}

/** Het hele inloggen: pagina openen, code opvangen, code inwisselen. */
export async function inloggenBijSchool(): Promise<Tokens> {
  const verifier = willekeurig(48);
  const state = willekeurig(24);
  const nonce = willekeurig(24);

  const terug = leesTerugsturing(await openInlogpagina(inlogUrl(await codeChallenge(verifier), state, nonce)));
  if (terug.fout) throw new Error(terug.fout);
  if (!terug.code || terug.state !== state) throw new Error('Ongeldig antwoord van de inlogpagina');

  return naarTokens(
    await tokenVerzoek({
      grant_type: 'authorization_code',
      code: terug.code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  );
}

export async function vernieuwTokens(oud: Tokens): Promise<Tokens> {
  return naarTokens(await tokenVerzoek({ grant_type: 'refresh_token', refresh_token: oud.refreshToken }), oud);
}

/** Meldt de sessie ook bij de server af. Mislukt dat (offline), dan is lokaal wissen genoeg. */
export async function afmelden(tokens: Tokens | null): Promise<void> {
  if (!tokens?.idToken) return;
  await fetch(`${ACCOUNTS}/connect/endsession?id_token_hint=${encodeURIComponent(tokens.idToken)}`).catch(
    () => undefined,
  );
}
