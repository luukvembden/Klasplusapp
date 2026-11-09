import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api, type ActiviteitOnderdeel } from '../api';
import { BijlagenLijst } from '../components/meer/BijlagenLijst';
import { TekstMetLinks } from '../components/les/TekstMetLinks';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useLaden } from '../hooks/useLaden';
import { inschrijfStand } from '../lib/activiteiten';
import { htmlNaarTekst } from '../lib/tekst';
import '../components/les/les.css';
import '../components/meer/meer.css';
import '../components/ui/ui.css';

/** "Nog 12 van de 40 plekken vrij" */
function plekken(o: ActiviteitOnderdeel): string | null {
  if (o.plekkenVrij === null) return o.maxDeelnemers ? `Maximaal ${o.maxDeelnemers} deelnemers` : null;
  if (o.plekkenVrij <= 0) return null;
  if (o.maxDeelnemers) return `Nog ${o.plekkenVrij} van de ${o.maxDeelnemers} plekken vrij`;
  return o.plekkenVrij === 1 ? 'Nog 1 plek vrij' : `Nog ${o.plekkenVrij} plekken vrij`;
}

function OnderdeelKaart({
  o,
  bezig,
  onKies,
}: {
  o: ActiviteitOnderdeel;
  bezig: boolean;
  onKies: (inschrijven: boolean) => void;
}) {
  const details = o.detailsHtml ? htmlNaarTekst(o.detailsHtml) : '';
  const vol = o.plekkenVrij !== null && o.plekkenVrij <= 0;
  const plek = plekken(o);
  const kanIn = o.kanInschrijven && !o.ingeschreven && !vol;
  const kanUit = o.kanInschrijven && o.ingeschreven && !o.verplicht;

  return (
    <section className={`kaart onderdeel${o.ingeschreven ? ' onderdeel--gekozen' : ''}`}>
      <div className="onderdeel__kop">
        <span className="onderdeel__titel">{o.titel}</span>
        {o.ingeschreven ? (
          <span className="statuslabel statuslabel--klaar">{o.verplicht ? 'Ingedeeld' : 'Ingeschreven'}</span>
        ) : vol ? (
          <span className="statuslabel statuslabel--laat">Vol</span>
        ) : null}
      </div>
      {details && (
        <div className="onderdeel__tekst">
          <TekstMetLinks tekst={details} />
        </div>
      )}
      {plek && <p className="onderdeel__plekken">{plek}</p>}
      {o.ingeschreven && o.verplicht && <p className="onderdeel__plekken">School heeft je hiervoor ingedeeld.</p>}
      {o.bijlagen.length > 0 && <BijlagenLijst bijlagen={o.bijlagen} />}
      {kanIn && (
        <button type="button" className="knop-primair onderdeel__knop" disabled={bezig} onClick={() => onKies(true)}>
          {bezig ? 'Bezig…' : 'Inschrijven'}
        </button>
      )}
      {kanUit && (
        <button type="button" className="onderdeel__uit" disabled={bezig} onClick={() => onKies(false)}>
          {bezig ? 'Bezig…' : 'Uitschrijven'}
        </button>
      )}
    </section>
  );
}

/** Eén activiteit: uitleg, en per onderdeel inschrijven of uitschrijven. */
export function ActiviteitScherm() {
  const { id = '' } = useParams();
  const lijst = useLaden(() => api.activiteiten(), []);
  const onderdelen = useLaden(() => api.onderdelen(id), [id]);
  const a = lijst.data?.data.find((x) => x.id === id);
  const stand = a ? inschrijfStand(a) : null;
  const details = a?.detailsHtml ? htmlNaarTekst(a.detailsHtml) : '';
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<string | null>(null);

  const kies = async (o: ActiviteitOnderdeel, inschrijven: boolean) => {
    if (!inschrijven && !window.confirm(`Uitschrijven voor "${o.titel}"?`)) return;
    setBezig(o.id);
    setFout(null);
    setGelukt(null);
    try {
      await api.schrijfIn(o, inschrijven);
      await onderdelen.vernieuw();
      setGelukt(inschrijven ? `Je bent ingeschreven voor ${o.titel}.` : `Je bent uitgeschreven voor ${o.titel}.`);
    } catch (e) {
      setFout(e instanceof Error && e.message ? e.message : 'Dat lukte niet. Probeer het later opnieuw.');
    } finally {
      setBezig(null);
    }
  };

  const lijstOnderdelen = onderdelen.data?.data ?? [];

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/meer/activiteiten" label="Activiteiten" />
      <PaginaKop sub={stand?.tekst ?? ' '} titel={a?.titel ?? ' '} />
      <OfflineRegel resultaat={onderdelen.data} />
      {(lijst.fout || onderdelen.fout) && <p className="melding">{lijst.fout ?? onderdelen.fout}</p>}
      {fout && <p className="melding">{fout}</p>}
      {gelukt && (
        <p className="onderdeel__gelukt" role="status">
          <Check size={18} strokeWidth={2.6} aria-hidden="true" />
          {gelukt}
        </p>
      )}

      {details && (
        <section className="kaart lestekst">
          <TekstMetLinks tekst={details} />
        </section>
      )}

      {onderdelen.data && (
        <Sectie titel={lijstOnderdelen.length > 1 ? 'Kies een onderdeel' : 'Inschrijven'}>
          {lijstOnderdelen.length === 0 && <p className="melding">Hier kun je je (nog) niet voor inschrijven.</p>}
          <div className="onderdelen">
            {lijstOnderdelen.map((o) => (
              <OnderdeelKaart key={o.id} o={o} bezig={bezig === o.id} onKies={(aan) => kies(o, aan)} />
            ))}
          </div>
        </Sectie>
      )}
    </div>
  );
}
