import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { api, type BerichtKort } from '../api';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { korteDatum, plusDagen, tijd, zelfdeDag } from '../lib/datum';
import { useOngelezen, zetOngelezen } from '../lib/ongelezen';
import '../components/ui/ui.css';
import '../components/cijfers/cijfers.css';
import '../components/meer/meer.css';

/** Vandaag: "09:12"; gisteren: "gisteren"; anders "4 nov". */
function wanneer(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  if (zelfdeDag(d, nu)) return tijd(d);
  if (zelfdeDag(d, plusDagen(nu, -1))) return 'gisteren';
  return korteDatum(iso);
}

function BerichtRij({ b }: { b: BerichtKort }) {
  return (
    <Link
      to={`/meer/berichten/${encodeURIComponent(b.id)}`}
      className={`berichtrij${b.gelezen ? '' : ' berichtrij--ongelezen'}`}
    >
      <span className={`berichtrij__stip${b.gelezen ? ' berichtrij__stip--gelezen' : ''}`} aria-hidden="true" />
      <span className="berichtrij__tekst">
        <span className="berichtrij__boven">
          <span className="berichtrij__van">{b.afzender}</span>
          <span className="berichtrij__datum">{wanneer(b.verzondenOp)}</span>
        </span>
        <span className="berichtrij__onderwerp">
          {b.belangrijk && <span className="visueel-verborgen">Belangrijk: </span>}
          {b.onderwerp}
          {b.heeftBijlagen && <Paperclip size={13} strokeWidth={2.2} aria-label="met bijlage" />}
        </span>
        {!b.gelezen && <span className="visueel-verborgen">Ongelezen</span>}
      </span>
    </Link>
  );
}

/** Postvak: nieuwste bovenaan, ongelezen vet met een stip. */
export function Berichten() {
  const geladen = useLaden(() => api.berichten(), []);
  const lijst = geladen.data?.data;
  const ongelezen = useOngelezen();

  // De lijst is de beste bron voor het rode getal: zo loopt het altijd gelijk met wat je ziet.
  useEffect(() => {
    if (lijst && !geladen.data?.offline) zetOngelezen(lijst.filter((b) => !b.gelezen).length);
  }, [lijst, geladen.data?.offline]);

  return (
    <div className="scherm">
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/meer" label="Meer" />
        <PaginaKop titel="Berichten" sub={ongelezen ? `${ongelezen} ongelezen` : 'Postvak IN'} />
        <OfflineRegel resultaat={geladen.data} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
          <div className="pagina pagina--onder-kop">
            <section className="kaart" aria-busy={!lijst}>
              {geladen.fout && <p className="melding">{geladen.fout}</p>}
              {lijst && lijst.length === 0 && <p className="melding">Je postvak is leeg.</p>}
              {lijst?.map((b) => <BerichtRij key={b.id} b={b} />)}
            </section>
          </div>
        </VegenOmTeVernieuwen>
      </div>
    </div>
  );
}
