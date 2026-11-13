import { Capacitor } from '@capacitor/core';
import { version } from '../../package.json';
import { lees, schrijf } from './opslag';

// Klas+ staat (nog) niet in de Play Store, dus updates komen niet vanzelf. Op Android kijkt de app daarom
// zelf op GitHub of er een nieuwere versie is. Dat is de enige plek buiten je school waar Klas+ contact mee
// maakt, en er gaat niets van jou mee: alleen de vraag "wat is de nieuwste versie?".

const RELEASES = 'https://api.github.com/repos/Luukve6/Klasplusapp/releases/latest';
/** Niet vaker dan eens per zes uur vragen. */
const WACHT = 6 * 60 * 60 * 1000;
const LAATSTE = 'update.laatste';
const GENEGEERD = 'update.genegeerd';

export interface Update {
  versie: string;
  /** Direct naar de APK, of anders de pagina van de release. */
  url: string;
}

/** "0.1.14" is nieuwer dan "0.1.13"? */
export function isNieuwer(nieuw: string, huidig: string): boolean {
  const a = nieuw.replace(/^v/, '').split('.').map((d) => Number.parseInt(d, 10) || 0);
  const b = huidig.replace(/^v/, '').split('.').map((d) => Number.parseInt(d, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/** Is er een nieuwere versie dan deze? Null als niet, als je hem hebt weggeklikt, of buiten Android. */
export async function zoekUpdate(): Promise<Update | null> {
  if (Capacitor.getPlatform() !== 'android') return null;
  const bewaard = lees<{ op: number; update: Update | null }>(LAATSTE);
  let update = bewaard?.update ?? null;
  if (!bewaard || Date.now() - bewaard.op > WACHT) {
    const antwoord = await fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json' } });
    if (!antwoord.ok) return null;
    const release = (await antwoord.json()) as {
      tag_name?: string;
      html_url?: string;
      assets?: { name: string; browser_download_url: string }[];
    };
    const versie = (release.tag_name ?? '').replace(/^v/, '');
    const apk = release.assets?.find((a) => a.name.endsWith('.apk'));
    update = versie ? { versie, url: apk?.browser_download_url ?? release.html_url ?? '' } : null;
    schrijf(LAATSTE, { op: Date.now(), update });
  }
  if (!update || !update.url || !isNieuwer(update.versie, version)) return null;
  if (lees<string>(GENEGEERD) === update.versie) return null;
  return update;
}

/** "Later": niet meer vragen voor deze versie (wel weer bij de volgende). */
export const negeerUpdate = (versie: string) => schrijf(GENEGEERD, versie);
