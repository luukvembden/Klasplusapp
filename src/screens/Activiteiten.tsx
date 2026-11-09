import { Link } from 'react-router-dom';
import { api, type Activiteit } from '../api';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { inschrijfStand } from '../lib/activiteiten';
import '../components/ui/ui.css';
import '../components/cijfers/cijfers.css';
import '../components/meer/meer.css';

function ActiviteitRij({ a }: { a: Activiteit }) {
  const stand = inschrijfStand(a);
  return (
    <Link to={`/meer/activiteiten/${encodeURIComponent(a.id)}`} className="opdrachtrij">
      <span className="opdrachtrij__tekst">
        <span className="opdrachtrij__vak">{a.titel}</span>
        <span className="opdrachtrij__titel">{stand.tekst}</span>
      </span>
      {/* Al ingeschreven gaat voor op hoe lang je nog kunt inschrijven. */}
      {a.ingeschreven ? (
        <span className="statuslabel statuslabel--klaar">Ingeschreven</span>
      ) : (
        stand.label && <span className={`statuslabel${stand.label.soort ? ` statuslabel--${stand.label.soort}` : ''}`}>{stand.label.tekst}</span>
      )}
    </Link>
  );
}

/** Activiteiten van school: eerst waarvoor je je nu kunt inschrijven, daarna de rest. */
export function Activiteiten() {
  const geladen = useLaden(() => api.activiteiten(), []);
  const lijst = geladen.data?.data;
  const open = (lijst ?? [])
    .filter((a) => inschrijfStand(a).open)
    .sort((a, b) => (a.inschrijvenTot ?? '9').localeCompare(b.inschrijvenTot ?? '9'));
  const overig = (lijst ?? [])
    .filter((a) => !inschrijfStand(a).open)
    .sort((a, b) => (b.inschrijvenTot ?? '').localeCompare(a.inschrijvenTot ?? ''));

  return (
    <div className="scherm">
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/meer" label="Meer" />
        <PaginaKop
          titel="Activiteiten"
          sub={lijst ? (open.length ? `${open.length} open voor inschrijving` : 'Nu niets om je voor in te schrijven') : ' '}
        />
        <OfflineRegel resultaat={geladen.data} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
          <div className="pagina pagina--onder-kop">
            {geladen.fout && <p className="melding">{geladen.fout}</p>}
            {lijst && lijst.length === 0 && <p className="melding">Je school heeft nu geen activiteiten klaargezet.</p>}
            {open.length > 0 && (
              <Sectie titel="Inschrijven kan nu">
                <section className="kaart">
                  {open.map((a) => (
                    <ActiviteitRij key={a.id} a={a} />
                  ))}
                </section>
              </Sectie>
            )}
            {overig.length > 0 && (
              <Sectie titel={open.length ? 'Overige' : 'Activiteiten'}>
                <section className="kaart">
                  {overig.map((a) => (
                    <ActiviteitRij key={a.id} a={a} />
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
