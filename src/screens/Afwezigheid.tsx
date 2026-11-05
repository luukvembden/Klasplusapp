import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api, type Afwezigheid as AfwezigheidT } from '../api';
import { AfwezigheidRij } from '../components/afwezigheid/AfwezigheidRij';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { Sectie } from '../components/ui/Sectie';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { maandTitel, nlTijd } from '../lib/datum';
import '../components/agenda/agenda.css';
import '../components/huiswerk/huiswerk.css';
import '../components/ui/ui.css';

/** "6 keer · 2 niet geoorloofd" */
function samenvatting(lijst: AfwezigheidT[]): string {
  if (lijst.length === 0) return 'dit schooljaar';
  const niet = lijst.filter((a) => !a.geoorloofd).length;
  return `${lijst.length} keer${niet > 0 ? ` · ${niet} niet geoorloofd` : ''}`;
}

/** Alle afwezigheden van dit schooljaar, per maand, nieuwste bovenaan. Alleen om te bekijken. */
export function Afwezigheid() {
  const geladen = useLaden(() => api.afwezigheden(), []);
  // De knop opent de meldingen. Mag je zelf melden, dan een plusje; kun je ze alleen bekijken, een loepje.
  const opties = useLaden(() => api.meldOpties(), []).data;
  const magMelden = !!opties;
  const lijst = [...(geladen.data?.data ?? [])].sort((a, b) => b.start.localeCompare(a.start));

  const perMaand = new Map<string, AfwezigheidT[]>();
  for (const a of lijst) {
    const d = nlTijd(new Date(a.start));
    const sleutel = `${d.jaar}-${d.maand}`;
    perMaand.set(sleutel, [...(perMaand.get(sleutel) ?? []), a]);
  }
  const klaar = geladen.data && !geladen.laden && !geladen.fout;

  return (
    <div className="huiswerk">
      <header className="agendakop">
        <div className="agendakop__tekst">
          <h1 className="agendakop__titel">Afwezigheid</h1>
          <span className="agendakop__sub">{geladen.data ? samenvatting(lijst) : ' '}</span>
        </div>
      </header>

      <div className="agenda__midden">
        <div className={`huiswerk__lijst${magMelden ? ' huiswerk__lijst--met-plus' : ''}`} aria-busy={geladen.laden}>
          <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
            <div className="pagina">
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
          <Link
            to="/afwezigheid/melden"
            className="plusknop"
            aria-label={opties.kanMelden ? 'Afwezigheid melden' : 'Meldingen bekijken'}
          >
            {opties.kanMelden ? (
              <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Search size={24} strokeWidth={2.4} aria-hidden="true" />
            )}
          </Link>
        )}
      </div>

      <BijgewerktBalk resultaat={geladen.data} />
    </div>
  );
}
