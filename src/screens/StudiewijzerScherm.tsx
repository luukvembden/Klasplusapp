import { useParams } from 'react-router-dom';
import { api } from '../api';
import { TekstMetLinks } from '../components/les/TekstMetLinks';
import { BijlagenLijst } from '../components/meer/BijlagenLijst';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { beginVanDag, plusDagen } from '../lib/datum';
import { htmlNaarTekst } from '../lib/tekst';
import { periode } from './Studiewijzers';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/meer/meer.css';

/** Valt vandaag in dit onderdeel? Dan krijgt het het label "Nu". */
function isNu(van: string | null, tot: string | null): boolean {
  if (!van || !tot) return false;
  const vandaag = beginVanDag(new Date()).getTime();
  return beginVanDag(new Date(van)).getTime() <= vandaag && vandaag < plusDagen(beginVanDag(new Date(tot)), 1).getTime();
}

/** Eén studiewijzer: per onderdeel de titel, de periode, wat de docent schreef en de bronnen. */
export function StudiewijzerScherm() {
  const { id = '' } = useParams();
  const geladen = useLaden(() => api.studiewijzer(id), [id]);
  const sw = geladen.data?.data;

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/meer/studiewijzers" label="Studiewijzers" />
        <PaginaKop sub={sw ? periode(sw.van, sw.tot) || ' ' : ' '} titel={sw?.titel ?? 'Studiewijzer'} />
      </VasteKop>
      <OfflineRegel resultaat={geladen.data} />
      <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
        {geladen.fout && <p className="melding">{geladen.fout}</p>}
        {sw && sw.onderdelen.length === 0 && <p className="melding">Deze studiewijzer is nog leeg.</p>}
        <div className="studiewijzer">
          {sw?.onderdelen.map((o) => {
            const tekst = o.omschrijvingHtml ? htmlNaarTekst(o.omschrijvingHtml) : '';
            const nu = isNu(o.van, o.tot);
            return (
              <section key={o.id} className={`studiewijzer__onderdeel${nu ? ' studiewijzer__onderdeel--nu' : ''}`}>
                <div className="studiewijzer__kop">
                  <h2 className="studiewijzer__titel">{o.titel}</h2>
                  {nu && <span className="leslabel leslabel--so">Nu</span>}
                </div>
                {periode(o.van, o.tot) && <p className="studiewijzer__periode">{periode(o.van, o.tot)}</p>}
                {tekst && (
                  <div className="kaart lestekst">
                    <TekstMetLinks tekst={tekst} />
                  </div>
                )}
                {o.bronnen.length > 0 && <BijlagenLijst bijlagen={o.bronnen} />}
              </section>
            );
          })}
        </div>
      </VegenOmTeVernieuwen>
    </div>
  );
}
