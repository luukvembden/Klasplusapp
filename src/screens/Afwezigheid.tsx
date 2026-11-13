import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, type Afwezigheid as AfwezigheidT } from '../api';
import { AfwezigheidRij } from '../components/afwezigheid/AfwezigheidRij';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { maandTitel, nlTijd } from '../lib/datum';
import '../components/agenda/agenda.css';
import '../components/cijfers/cijfers.css';
import '../components/huiswerk/huiswerk.css';
import '../components/ui/ui.css';
import { LaadKaart } from '../components/ui/Laden';

/** "6 keer · 2 niet geoorloofd" */
function samenvatting(lijst: AfwezigheidT[]): string {
  if (lijst.length === 0) return 'dit schooljaar';
  const niet = lijst.filter((a) => !a.geoorloofd).length;
  return `${lijst.length} keer${niet > 0 ? ` · ${niet} niet geoorloofd` : ''}`;
}

/** Alle afwezigheden van dit schooljaar, per maand, nieuwste bovenaan. Alleen om te bekijken. */
export function Afwezigheid() {
  const geladen = useLaden(() => api.afwezigheden(), []);
  // Rechtsboven altijd "Meldingen"; mag dit account zelf afwezig melden, dan rechtsonder ook een plusje.
  const opties = useLaden(() => api.meldOpties(), []).data;
  const magMelden = !!opties?.kanMelden;
  const lijst = [...(geladen.data?.data ?? [])].sort((a, b) => b.start.localeCompare(a.start));

  const perMaand = new Map<string, AfwezigheidT[]>();
  for (const a of lijst) {
    const d = nlTijd(new Date(a.start));
    const sleutel = `${d.jaar}-${d.maand}`;
    perMaand.set(sleutel, [...(perMaand.get(sleutel) ?? []), a]);
  }
  const klaar = geladen.data && !geladen.laden && !geladen.fout;

  return (
    <div className="scherm">
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/meer" label="Meer" />
        {/* Rechtsboven, in dezelfde knop als "Overgang" bij Gemiddeldes. */}
        <Link to="/meer/afwezigheid/melden" className="agendakop__vandaag agendakop__knoplink gemiddeldes__knop">
          Meldingen
        </Link>
        <PaginaKop titel="Afwezigheid" sub={geladen.data ? samenvatting(lijst) : ' '} />
        <OfflineRegel resultaat={geladen.data} />
      </div>

      <div className="agenda__midden">
        <div className="scherm__lijst" aria-busy={geladen.laden}>
          <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
            <div className="pagina pagina--onder-kop">
              {!geladen.data && !geladen.fout && <LaadKaart />}
              {geladen.fout && <p className="melding">{geladen.fout}</p>}
              {klaar && lijst.length === 0 && <p className="melding">Je bent dit schooljaar nog niet afwezig geweest.</p>}
              {[...perMaand.values()].map((maand) => (
                <Sectie key={maand[0].id} titel={maandTitel(new Date(maand[0].start))}>
                  <section className="kaart">
                    {maand.map((a) => (
                      <AfwezigheidRij key={a.id} afwezigheid={a} />
                    ))}
                  </section>
                </Sectie>
              ))}
            </div>
          </VegenOmTeVernieuwen>
        </div>
        {magMelden && (
          <Link to="/meer/afwezigheid/melden/nieuw" className="plusknop" aria-label="Afwezigheid melden">
            <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
