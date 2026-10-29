import { Link } from 'react-router-dom';
import type { Afspraak } from '../../api';
import { tijdvak } from '../../lib/datum';
import { useInstellingen } from '../../lib/instellingen';
import { metHoofdletter } from '../../lib/tekst';
import { LesLabel } from './LesLabel';
import './agenda.css';
import '../les/les.css';

/** "AK – KNNW – H5.AK4" → "KNNW". Alleen bij lessen; een eigen afspraak heeft geen docent. */
function docentCode(a: Afspraak): string | null {
  if (a.labels.includes('eigen')) return null;
  const delen = a.omschrijving.split(' – ');
  return delen.length >= 3 ? delen[1] : null;
}

/** De twee regels tekst, in de weergave die de leerling in Instellingen koos. */
function regels(a: Afspraak, modern: boolean): [string, string] {
  const tijd = a.heleDag ? 'Hele dag' : tijdvak(a.start, a.einde);
  if (modern) {
    // "Aardrijkskunde" / "09:00 – 09:45 · S252 · KNNW"
    const titel = a.vak && !a.labels.includes('eigen') ? metHoofdletter(a.vak) : a.omschrijving;
    return [titel, [tijd, a.lokaal, docentCode(a)].filter(Boolean).join(' · ')];
  }
  // Klassiek: "AK – KNNW – H5.AK4 (S252)" / "09:00 – 09:45"
  return [a.lokaal ? `${a.omschrijving} (${a.lokaal})` : a.omschrijving, tijd];
}

/** Eén les in de lijst: links het uurnummer in een vierkantje, dan twee regels tekst, rechts de labels. */
export function LesRij({ afspraak }: { afspraak: Afspraak }) {
  const { agenda } = useInstellingen();
  const [titel, onder] = regels(afspraak, agenda === 'modern');

  return (
    <Link to={`/agenda/${encodeURIComponent(afspraak.id)}`} className="lesrij lesrij--link">
      {/* Zonder lesuur (bijvoorbeeld een persoonlijke afspraak) blijft het vierkantje leeg, zodat alles netjes uitlijnt. */}
      <div className="lesrij__uur" aria-label={afspraak.lesuur ? `${afspraak.lesuur}e uur` : undefined}>
        {afspraak.lesuur ?? ''}
      </div>
      <div className="lesrij__tekst">
        <span className="lesrij__titel">{titel}</span>
        <span className="lesrij__tijd">{onder}</span>
      </div>
      {afspraak.labels.length > 0 && (
        <div className="lesrij__labels">
          {afspraak.labels.map((l) => (
            <LesLabel key={l} label={l} afgerond={afspraak.afgerond} />
          ))}
        </div>
      )}
    </Link>
  );
}
