import { Link } from 'react-router-dom';
import { CijferRij } from '../components/cijfers/CijferRij';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { Sectie } from '../components/ui/Sectie';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useCijfers } from '../hooks/useCijfers';
import { meestRecent } from '../lib/cijfers';
import '../components/agenda/agenda.css';
import '../components/cijfers/cijfers.css';

const AANTAL_RECENT = 20;

export function Cijfers() {
  const { cijfers, profiel, resultaat, fout, vernieuw } = useCijfers();
  // Net als op de andere schermen: titel groot, daaronder klas en periode.
  const onder = [profiel?.klas, profiel?.periode].filter(Boolean).join(' · ');

  return (
    <div className="scherm">
      <header className="agendakop">
        <div className="agendakop__tekst">
          <h1 className="agendakop__titel">Cijfers</h1>
          <span className="agendakop__sub">{onder || ' '}</span>
        </div>
        {/* Zelfde knop als "Vandaag" in de Agenda. */}
        <div className="agendakop__knoppen">
          <Link to="/cijfers/gemiddeldes" className="agendakop__vandaag agendakop__knoplink">
            Gemiddeldes
          </Link>
        </div>
      </header>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={vernieuw}>
          <div className="pagina pagina--onder-kop">
            <Sectie titel="Recent">
              <section className="kaart" aria-busy={!cijfers}>
                {fout && <p className="melding">{fout}</p>}
                {cijfers && cijfers.length === 0 && <p className="melding">Nog geen cijfers.</p>}
                {cijfers && meestRecent(cijfers, AANTAL_RECENT).map((c) => <CijferRij key={c.id} cijfer={c} />)}
              </section>
            </Sectie>

          </div>
        </VegenOmTeVernieuwen>
      </div>

      <BijgewerktBalk resultaat={resultaat} />
    </div>
  );
}
