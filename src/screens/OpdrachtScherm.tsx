import { useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api } from '../api';
import { BijlagenLijst } from '../components/meer/BijlagenLijst';
import { OpdrachtLabel } from '../components/meer/OpdrachtLabel';
import { GegevenRij } from '../components/les/GegevenRij';
import { TekstMetLinks } from '../components/les/TekstMetLinks';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useLaden } from '../hooks/useLaden';
import { datumEnTijd } from '../lib/datum';
import { htmlNaarTekst, metHoofdletter, openExtern } from '../lib/tekst';
import '../components/les/les.css';
import '../components/meer/meer.css';
import '../components/ui/ui.css';

/** Eén opdracht: wanneer inleveren, status, de opdracht zelf, bijlagen en de feedback van de docent. */
export function OpdrachtScherm() {
  const { id = '' } = useParams();
  const geladen = useLaden(() => api.opdracht(id), [id]);
  const o = geladen.data?.data;
  const omschrijving = o?.omschrijvingHtml ? htmlNaarTekst(o.omschrijvingHtml) : '';
  const feedback = o?.feedbackHtml ? htmlNaarTekst(o.feedbackHtml) : '';
  const site = api.schoolsite();

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/meer/opdrachten" label="Opdrachten" />
      <PaginaKop sub={o?.vak ? metHoofdletter(o.vak) : ' '} titel={o?.titel ?? ' '} />
      <OfflineRegel resultaat={geladen.data} />
      {geladen.fout && <p className="melding">{geladen.fout}</p>}

      {o && (
        <>
          <section className="kaart">
            <GegevenRij label="Inleveren voor" waarde={o.inleverenVoor ? datumEnTijd(o.inleverenVoor) : 'Geen datum'} />
            <GegevenRij label="Status" waarde={<OpdrachtLabel opdracht={o} />} />
            <GegevenRij label="Ingeleverd op" waarde={o.ingeleverdOp ? datumEnTijd(o.ingeleverdOp) : undefined} />
            <GegevenRij label={o.docenten.length > 1 ? 'Docenten' : 'Docent'} waarde={o.docenten.join(', ')} />
          </section>

          <Sectie titel="Opdracht">
            <section className="kaart lestekst">
              {omschrijving ? <TekstMetLinks tekst={omschrijving} /> : 'De docent heeft hier geen uitleg bij gezet.'}
            </section>
          </Sectie>

          {o.bijlagen.length > 0 && (
            <Sectie titel={o.bijlagen.length === 1 ? 'Bijlage' : 'Bijlagen'}>
              <BijlagenLijst bijlagen={o.bijlagen} />
            </Sectie>
          )}

          {(feedback || o.feedbackBijlagen.length > 0) && (
            <Sectie titel="Feedback van de docent">
              {feedback && (
                <section className="kaart lestekst">
                  <TekstMetLinks tekst={feedback} />
                </section>
              )}
              {o.feedbackBijlagen.length > 0 && <BijlagenLijst bijlagen={o.feedbackBijlagen} />}
            </Sectie>
          )}

          {/* Inleveren kan (nog) niet in Klas+; dat gaat via de website van de school. */}
          {site && (o.status === 'open' || o.status === 'te-laat') && (
            <button type="button" className="knop-primair" onClick={() => openExtern(site)}>
              Inleveren via de schoolsite
              <ExternalLink size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
