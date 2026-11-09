import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api, type Bijlage } from '../../api';
import './meer.css';

/** "Criteria betoog.pdf" → "PDF" */
const soort = (naam: string) => (naam.includes('.') ? naam.split('.').pop()!.slice(0, 4).toUpperCase() : 'BESTAND');

/** 219000 → "214 kB" */
function grootte(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Bijlagen van een bericht of opdracht. Tik op een bijlage om hem buiten de app te openen. */
export function BijlagenLijst({ bijlagen }: { bijlagen: Bijlage[] }) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const open = async (b: Bijlage) => {
    setBezig(b.id);
    setFout(null);
    try {
      await api.openBijlage(b);
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Kon de bijlage niet openen');
    } finally {
      setBezig(null);
    }
  };

  return (
    <>
      <section className="kaart">
        {bijlagen.map((b) => (
          <button key={b.id} type="button" className="bijlagerij" onClick={() => open(b)} disabled={bezig === b.id}>
            <span className="bijlagerij__type" aria-hidden="true">
              {soort(b.naam)}
            </span>
            <span className="bijlagerij__tekst">
              <span className="bijlagerij__naam">{b.naam}</span>
              <span className="bijlagerij__grootte">{bezig === b.id ? 'Bezig met openen…' : grootte(b.grootte)}</span>
            </span>
            <ExternalLink size={17} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
          </button>
        ))}
      </section>
      {fout && <p className="melding">{fout}</p>}
    </>
  );
}
