import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../api';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { korteDatum } from '../lib/datum';
import '../components/ui/ui.css';
import '../components/meer/meer.css';

/** "9 nov – 29 jan", of leeg als de school geen periode noemt. */
export const periode = (van: string | null, tot: string | null) =>
  van && tot ? `${korteDatum(van)} – ${korteDatum(tot)}` : van ? `vanaf ${korteDatum(van)}` : '';

/** De studiewijzers die nu gelden: per vak de planning van de docent. */
export function Studiewijzers() {
  const geladen = useLaden(() => api.studiewijzers(), []);
  const lijst = [...(geladen.data?.data ?? [])].sort((a, b) => a.titel.localeCompare(b.titel));
  const klaar = geladen.data && !geladen.laden && !geladen.fout;

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/meer" label="Meer" />
        <PaginaKop sub="De planning per vak van je docenten" titel="Studiewijzers" />
      </VasteKop>
      <OfflineRegel resultaat={geladen.data} />
      <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
        {geladen.fout && <p className="melding">{geladen.fout}</p>}
        {klaar && lijst.length === 0 && (
          <p className="melding">Je school heeft op dit moment geen studiewijzers voor je klaargezet.</p>
        )}
        {lijst.length > 0 && (
          <section className="kaart" aria-busy={geladen.laden}>
            {lijst.map((s) => (
              <Link key={s.id} to={`/meer/studiewijzers/${encodeURIComponent(s.id)}`} className="bijlagerij">
                <span className="bijlagerij__tekst">
                  <span className="bijlagerij__naam">{s.titel}</span>
                  <span className="bijlagerij__grootte">
                    {/* Alleen de periode: het vak staat meestal al in de titel. */}
                    {periode(s.van, s.tot)}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
              </Link>
            ))}
          </section>
        )}
      </VegenOmTeVernieuwen>
    </div>
  );
}
