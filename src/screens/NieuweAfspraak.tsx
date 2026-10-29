import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Invoerrij, opMoment } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { beginVanDag, naarInvoer, plusDagen, tijd, vanInvoer } from '../lib/datum';
import { api, isDemo, type AfspraakInvoer } from '../api';
import { useAfspraak } from '../hooks/useAfspraak';
import { toonDagInAgenda } from './Agenda';
import '../components/les/les.css';
import '../components/instellingen/instellingen.css';

/** Een bestaande eigen afspraak: het id, en wat er nu in staat. */
interface Bestaand {
  id: string;
  invoer: AfspraakInvoer;
}

/** Zelf een persoonlijke afspraak toevoegen. Alleen jij ziet hem, ook in de officiële app. */
export function NieuweAfspraak() {
  const [params] = useSearchParams();
  const startdag = vanInvoer(params.get('dag') ?? '') ?? beginVanDag(new Date());
  return <AfspraakFormulier startdag={startdag} />;
}

/** Een eigen afspraak aanpassen: hetzelfde formulier, alvast ingevuld. */
export function AfspraakBewerken() {
  const { id = '' } = useParams();
  const { afspraak: a, tekst, fout } = useAfspraak(id);

  if (!a) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar={`/agenda/${encodeURIComponent(id)}`} label="Afspraak" />
        <p className="melding">{fout ?? 'Bezig met laden…'}</p>
      </div>
    );
  }
  if (!a.labels.includes('eigen')) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar={`/agenda/${encodeURIComponent(id)}`} label="Les" />
        <p className="melding">Alleen je eigen afspraken kun je bewerken.</p>
      </div>
    );
  }

  const invoer: AfspraakInvoer = {
    titel: a.omschrijving,
    heleDag: !!a.heleDag,
    start: a.start,
    einde: a.einde,
    locatie: a.lokaal ?? '',
    beschrijving: tekst ?? '',
  };
  return <AfspraakFormulier bestaand={{ id: a.id, invoer }} startdag={new Date(a.start)} />;
}

/** Begin- en eindwaarden voor de velden, uit een bestaande afspraak of voor een nieuwe op `startdag`. */
function beginwaarden(bestaand: AfspraakInvoer | undefined, startdag: Date) {
  if (!bestaand) {
    const dag = naarInvoer(startdag);
    return { beginDatum: dag, eindDatum: dag, beginTijd: '09:00', eindTijd: '10:00' };
  }
  const start = new Date(bestaand.start);
  // Bij een hele dag staat het einde op het begin van de dag erna; in het veld hoort de laatste dag.
  const einde = bestaand.heleDag ? plusDagen(new Date(bestaand.einde), -1) : new Date(bestaand.einde);
  return {
    beginDatum: naarInvoer(start),
    eindDatum: naarInvoer(einde),
    beginTijd: bestaand.heleDag ? '09:00' : tijd(start),
    eindTijd: bestaand.heleDag ? '10:00' : tijd(einde),
  };
}

function AfspraakFormulier({ bestaand, startdag }: { bestaand?: Bestaand; startdag: Date }) {
  const navigate = useNavigate();
  const oud = bestaand?.invoer;
  const begin = beginwaarden(oud, startdag);

  const [titel, setTitel] = useState(oud?.titel ?? '');
  const [heleDag, setHeleDag] = useState(oud?.heleDag ?? false);
  const [beginDatum, setBeginDatum] = useState(begin.beginDatum);
  const [eindDatum, setEindDatum] = useState(begin.eindDatum);
  const [beginTijd, setBeginTijd] = useState(begin.beginTijd);
  const [eindTijd, setEindTijd] = useState(begin.eindTijd);
  const [locatie, setLocatie] = useState(oud?.locatie ?? '');
  const [beschrijving, setBeschrijving] = useState(oud?.beschrijving ?? '');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const kiesBegin = (waarde: string) => {
    setBeginDatum(waarde);
    // Einde mag niet vóór het begin liggen.
    if (waarde && eindDatum < waarde) setEindDatum(waarde);
  };

  const opslaan = async () => {
    if (!titel.trim()) return setFout('Geef de afspraak een titel.');
    if (!vanInvoer(beginDatum) || !vanInvoer(eindDatum)) return setFout('Kies een begin- en einddatum.');

    const start = heleDag ? vanInvoer(beginDatum)! : opMoment(beginDatum, beginTijd);
    // Een hele dag loopt tot het begin van de dag na de einddatum.
    const einde = heleDag ? plusDagen(vanInvoer(eindDatum)!, 1) : opMoment(eindDatum, eindTijd);
    if (einde <= start) return setFout('Het einde moet na het begin liggen.');

    const gegevens: AfspraakInvoer = {
      titel: titel.trim(),
      heleDag,
      start: start.toISOString(),
      einde: einde.toISOString(),
      locatie: locatie.trim(),
      beschrijving: beschrijving.trim(),
    };
    setBezig(true);
    setFout(null);
    try {
      if (bestaand) await api.wijzigAfspraak(bestaand.id, gegevens);
      else await api.maakAfspraak(gegevens);
    } catch (e) {
      setBezig(false);
      return setFout(
        navigator.onLine
          ? `Opslaan is niet gelukt. (${e instanceof Error ? e.message : String(e)})`
          : 'Je bent offline. Opslaan kan alleen met internet.',
      );
    }
    toonDagInAgenda(start);
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <div className="pagina pagina--met-terug">
      {bestaand ? (
        <TerugLink naar={`/agenda/${encodeURIComponent(bestaand.id)}`} label="Afspraak" />
      ) : (
        <TerugLink naar="/" label="Agenda" />
      )}
      <PaginaKop titel={bestaand ? 'Afspraak bewerken' : 'Nieuwe afspraak'} />

      <section className="kaart">
        <Invoerrij label="Titel" voor="titel">
          <input
            id="titel"
            className="invoerrij__veld"
            placeholder="Bijvoorbeeld bijles"
            value={titel}
            onChange={(e) => {
              setTitel(e.target.value);
              setFout(null);
            }}
            autoComplete="off"
            enterKeyHint="next"
          />
        </Invoerrij>
      </section>

      <Sectie titel="Wanneer">
        <section className="kaart">
          <label className="instelrij">
            <span>Hele dag</span>
            <input type="checkbox" role="switch" checked={heleDag} onChange={(e) => setHeleDag(e.target.checked)} />
          </label>
          <Invoerrij label="Begindatum" voor="begindatum">
            <input id="begindatum" type="date" className="invoerrij__veld" value={beginDatum} onChange={(e) => kiesBegin(e.target.value)} />
          </Invoerrij>
          <Invoerrij label="Einddatum" voor="einddatum">
            <input
              id="einddatum"
              type="date"
              className="invoerrij__veld"
              value={eindDatum}
              min={beginDatum}
              onChange={(e) => setEindDatum(e.target.value)}
            />
          </Invoerrij>
          {!heleDag && (
            <>
              <Invoerrij label="Begintijd" voor="begintijd">
                <input id="begintijd" type="time" className="invoerrij__veld" value={beginTijd} onChange={(e) => setBeginTijd(e.target.value)} />
              </Invoerrij>
              <Invoerrij label="Eindtijd" voor="eindtijd">
                <input id="eindtijd" type="time" className="invoerrij__veld" value={eindTijd} onChange={(e) => setEindTijd(e.target.value)} />
              </Invoerrij>
            </>
          )}
        </section>
      </Sectie>

      <Sectie titel="Details">
        <section className="kaart">
          <Invoerrij label="Locatie" voor="locatie">
            <input
              id="locatie"
              className="invoerrij__veld"
              placeholder="Optioneel"
              value={locatie}
              onChange={(e) => setLocatie(e.target.value)}
              autoComplete="off"
            />
          </Invoerrij>
        </section>
        <section className="kaart">
          <textarea
            className="invoer-beschrijving"
            aria-label="Beschrijving"
            placeholder="Beschrijving (optioneel)"
            rows={4}
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
          />
        </section>
      </Sectie>

      {fout && (
        <p className="formulier-fout" role="alert">
          {fout}
        </p>
      )}

      <button type="button" className="knop-primair" onClick={opslaan} disabled={bezig}>
        {bezig ? 'Bezig met opslaan…' : 'Opslaan'}
      </button>
      <p className="instellingen__let-op">
        {isDemo
          ? 'In de demo blijft deze afspraak op dit toestel.'
          : 'Dit wordt een persoonlijke afspraak in je schoolagenda. Alleen jij ziet hem, ook in de officiële app.'}
      </p>
    </div>
  );
}
