import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api, type Activiteit, type ActiviteitOnderdeel } from '../api';
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

/** Wat we laten zien als in- of uitschrijven niet lukt: de uitleg van school, of een gewone zin. */
function foutBijInschrijven(e: unknown, inschrijven: boolean): string {
  const fout = e as { status?: number; uitleg?: string | null; message?: string };
  if (fout?.uitleg) return fout.uitleg;
  if (fout?.status === 400)
    return inschrijven
      ? 'School nam de inschrijving niet aan. Misschien ben je al ingeschreven voor een ander moment, of is dit net vol. Lukt het niet, schrijf je dan in via de schoolsite.'
      : 'School nam het uitschrijven niet aan. Probeer het via de schoolsite.';
  return fout?.message || 'Dat lukte niet. Probeer het later opnieuw.';
}

/** "Nog 12 van de 40 plekken vrij" */
function plekken(o: ActiviteitOnderdeel): string | null {
  if (o.plekkenVrij === null) return o.maxDeelnemers ? `Maximaal ${o.maxDeelnemers} deelnemers` : null;
  if (o.plekkenVrij <= 0) return null;
  if (o.maxDeelnemers) return `Nog ${o.plekkenVrij} van de ${o.maxDeelnemers} plekken vrij`;
  return o.plekkenVrij === 1 ? 'Nog 1 plek vrij' : `Nog ${o.plekkenVrij} plekken vrij`;
}

function OnderdeelKaart({
  o,
  activiteit,
  bezig,
  onKies,
}: {
  o: ActiviteitOnderdeel;
  /** Voor de inschrijfperiode als het onderdeel zelf geen data heeft. */
  activiteit?: Activiteit;
  bezig: boolean;
  onKies: (inschrijven: boolean) => void;
}) {
  const details = o.detailsHtml ? htmlNaarTekst(o.detailsHtml) : '';
  const vol = o.plekkenVrij !== null && o.plekkenVrij <= 0;
  const plek = plekken(o);
  // School zegt soms "op in te schrijven" terwijl de periode voorbij is; de data zijn leidend.
  const periode = o.inschrijvenVan || o.inschrijvenTot ? o : activiteit;
  const stand = periode ? inschrijfStand(periode) : null;
  const periodeOpen = stand?.open ?? true;
  const kanIn = periodeOpen && o.kanInschrijven && !o.ingeschreven && !vol;
  const kanUit = periodeOpen && o.kanInschrijven && o.ingeschreven && !o.verplicht;
  const gesloten = !periodeOpen && !o.ingeschreven;

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
      {gesloten && (
        <button type="button" className="onderdeel__dicht" disabled>
          {stand?.tekst.startsWith('Inschrijven vanaf') ? stand.tekst : 'Inschrijving gesloten'}
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
      setFout(foutBijInschrijven(e, inschrijven));
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
              <OnderdeelKaart key={o.id} o={o} activiteit={a} bezig={bezig === o.id} onKies={(aan) => kies(o, aan)} />
            ))}
          </div>
        </Sectie>
      )}
    </div>
  );
}
