import { Link } from 'react-router-dom';
import { api, type OpdrachtKort } from '../api';
import { OpdrachtLabel } from '../components/meer/OpdrachtLabel';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { korteDatumMetJaar } from '../lib/datum';
import { metHoofdletter } from '../lib/tekst';
import '../components/ui/ui.css';
import '../components/cijfers/cijfers.css';
import '../components/meer/meer.css';
import { LaadKaart } from '../components/ui/Laden';

function OpdrachtRij({ o }: { o: OpdrachtKort }) {
  const datum = o.ingeleverdOp ?? o.inleverenVoor;
  return (
    <Link to={`/meer/opdrachten/${encodeURIComponent(o.id)}`} className="opdrachtrij">
      <span className="opdrachtrij__tekst">
        <span className="opdrachtrij__vak">{o.vak ? metHoofdletter(o.vak) : o.titel}</span>
        <span className="opdrachtrij__titel">
          {o.vak ? o.titel : ''}
          {o.vak && datum ? ' · ' : ''}
          {datum ? korteDatumMetJaar(datum) : ''}
        </span>
      </span>
      <OpdrachtLabel opdracht={o} />
    </Link>
  );
}

const nogTeDoen = (o: OpdrachtKort) => o.status === 'open' || o.status === 'te-laat';

/** Opdrachten van dit schooljaar: eerst wat nog moet (eerstvolgende bovenaan), dan wat al is ingeleverd. */
export function Opdrachten() {
  const geladen = useLaden(() => api.opdrachten(), []);
  const lijst = geladen.data?.data;
  const open = (lijst ?? [])
    .filter(nogTeDoen)
    .sort((a, b) => (a.inleverenVoor ?? '9').localeCompare(b.inleverenVoor ?? '9'));
  const klaar = (lijst ?? [])
    .filter((o) => !nogTeDoen(o))
    .sort((a, b) => (b.ingeleverdOp ?? b.inleverenVoor ?? '').localeCompare(a.ingeleverdOp ?? a.inleverenVoor ?? ''));
  const openNog = open.filter((o) => o.status === 'open').length;

  return (
    <div className="scherm">
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/meer" label="Meer" />
        <PaginaKop titel="Opdrachten" sub={lijst ? (openNog ? `${openNog} open` : 'Alles ingeleverd') : ' '} />
        <OfflineRegel resultaat={geladen.data} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
          <div className="pagina pagina--onder-kop">
            {!lijst && !geladen.fout && <LaadKaart />}
            {geladen.fout && <p className="melding">{geladen.fout}</p>}
            {lijst && lijst.length === 0 && <p className="melding">Geen opdrachten dit schooljaar.</p>}
            {open.length > 0 && (
              <Sectie titel="Nog inleveren">
                <section className="kaart">
                  {open.map((o) => (
                    <OpdrachtRij key={o.id} o={o} />
                  ))}
                </section>
              </Sectie>
            )}
            {klaar.length > 0 && (
              <Sectie titel="Ingeleverd">
                <section className="kaart">
                  {klaar.map((o) => (
                    <OpdrachtRij key={o.id} o={o} />
                  ))}
                </section>
              </Sectie>
            )}
          </div>
        </VegenOmTeVernieuwen>
      </div>
    </div>
  );
}
