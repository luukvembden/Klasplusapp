import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { api, type BerichtKort, type BerichtMap } from '../api';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { korteDatumMetJaar, plusDagen, tijd, zelfdeDag } from '../lib/datum';
import { useOngelezen, zetOngelezen } from '../lib/ongelezen';
import '../components/ui/ui.css';
import '../components/cijfers/cijfers.css';
import '../components/agenda/agenda.css';
import '../components/meer/meer.css';

/** Vandaag: "09:12"; gisteren: "gisteren"; anders "4 nov", met jaartal als het niet dit jaar is. */
function wanneer(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  if (zelfdeDag(d, nu)) return tijd(d);
  if (zelfdeDag(d, plusDagen(nu, -1))) return 'gisteren';
  return korteDatumMetJaar(iso);
}

/** In Verzonden staat bij elk bericht aan wie het ging, in plaats van van wie. */
function BerichtRij({ b, verzonden }: { b: BerichtKort; verzonden: boolean }) {
  const wie = verzonden ? `Aan: ${b.aan.join(', ') || 'onbekend'}` : b.afzender;
  return (
    <Link
      to={`/meer/berichten/${encodeURIComponent(b.id)}`}
      className={`berichtrij${b.gelezen ? '' : ' berichtrij--ongelezen'}`}
    >
      <span className={`berichtrij__stip${b.gelezen ? ' berichtrij__stip--gelezen' : ''}`} aria-hidden="true" />
      <span className="berichtrij__tekst">
        <span className="berichtrij__boven">
          <span className="berichtrij__van">{wie}</span>
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

/** Postvak of verzonden berichten: nieuwste bovenaan, ongelezen vet met een stip. */
export function Berichten() {
  // Blijft staan als je een bericht opent en terugkomt, omdat deze pagina dan onder het bericht blijft liggen.
  const [map, setMap] = useState<BerichtMap>('postvak');
  const verzonden = map === 'verzonden';
  const geladen = useLaden(() => api.berichten(map), [map]);
  const lijst = geladen.data?.data;
  const ongelezen = useOngelezen();

  // De lijst van het postvak is de beste bron voor het rode getal: zo loopt het gelijk met wat je ziet.
  useEffect(() => {
    if (!verzonden && lijst && !geladen.data?.offline) zetOngelezen(lijst.filter((b) => !b.gelezen).length);
  }, [verzonden, lijst, geladen.data?.offline]);

  return (
    <div className="scherm">
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/meer" label="Meer" />
        {/* Rechts de andere map, in dezelfde knop als "Gemiddeldes" bij Cijfers. */}
        <div className="berichtenkop">
          <PaginaKop
            titel="Berichten"
            sub={verzonden ? 'Verzonden' : ongelezen ? `Postvak IN · ${ongelezen} ongelezen` : 'Postvak IN'}
          />
          <button
            type="button"
            className="agendakop__vandaag"
            onClick={() => setMap(verzonden ? 'postvak' : 'verzonden')}
          >
            {verzonden ? 'Postvak IN' : 'Verzonden'}
          </button>
        </div>
        <OfflineRegel resultaat={geladen.data} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
          <div className="pagina pagina--onder-kop">
            <section className="kaart" aria-busy={!lijst}>
              {geladen.fout && <p className="melding">{geladen.fout}</p>}
              {lijst && lijst.length === 0 && (
                <p className="melding">{verzonden ? 'Je hebt nog geen berichten verstuurd.' : 'Je postvak is leeg.'}</p>
              )}
              {lijst?.map((b) => <BerichtRij key={b.id} b={b} verzonden={verzonden} />)}
            </section>
          </div>
        </VegenOmTeVernieuwen>
      </div>
    </div>
  );
}
