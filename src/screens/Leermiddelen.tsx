import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api, type Leermiddel } from '../api';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import '../components/ui/ui.css';
import '../components/meer/meer.css';

/**
 * Leermiddelen: de digitale methodes die de school voor je klaarzet, op vak. Tik om de methode bij de
 * uitgever te openen (via de schoolserver, zodat je daar al bent ingelogd).
 */
export function Leermiddelen() {
  const geladen = useLaden(() => api.leermiddelen(), []);
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const lijst = [...(geladen.data?.data ?? [])].sort(
    (a, b) => (a.vak ?? '').localeCompare(b.vak ?? '') || a.titel.localeCompare(b.titel),
  );
  const klaar = geladen.data && !geladen.laden && !geladen.fout;

  const open = async (l: Leermiddel) => {
    setBezig(l.id);
    setFout(null);
    try {
      await api.openLeermiddel(l);
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Kon het leermiddel niet openen');
    } finally {
      setBezig(null);
    }
  };

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/meer" label="Meer" />
      <PaginaKop sub="Digitale methodes van je school" titel="Leermiddelen" />
      <OfflineRegel resultaat={geladen.data} />
      <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
        {geladen.fout && <p className="melding">{geladen.fout}</p>}
        {fout && <p className="melding">{fout}</p>}
        {klaar && lijst.length === 0 && <p className="melding">Je school heeft geen leermiddelen klaargezet.</p>}
        {lijst.length > 0 && (
          <section className="kaart" aria-busy={geladen.laden}>
            {lijst.map((l) => (
              <button
                key={l.id}
                type="button"
                className="bijlagerij"
                onClick={() => open(l)}
                disabled={!l.link || bezig === l.id}
              >
                <span className="bijlagerij__tekst">
                  <span className="bijlagerij__naam">{l.titel}</span>
                  <span className="bijlagerij__grootte">
                    {bezig === l.id ? 'Bezig met openen…' : [l.vak, l.uitgever].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {l.link && <ExternalLink size={17} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />}
              </button>
            ))}
          </section>
        )}
      </VegenOmTeVernieuwen>
    </div>
  );
}
