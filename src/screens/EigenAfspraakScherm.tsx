import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { api, type AfspraakDetail, type Resultaat } from '../api';
import { LesLabel } from '../components/agenda/LesLabel';
import { GegevenRij } from '../components/les/GegevenRij';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { dagTitel, datumEnTijd, plusDagen, tijdvak, zelfdeDag } from '../lib/datum';
import '../components/les/les.css';

interface Props {
  afspraak: AfspraakDetail;
  /** De beschrijving als gewone tekst. */
  tekst: string | null;
  resultaat?: Resultaat<unknown>;
}

/** Een eigen (persoonlijke) afspraak, in dezelfde opbouw als Lesinformatie, met bewerken en verwijderen. */
export function EigenAfspraakScherm({ afspraak: a, tekst, resultaat }: Props) {
  const navigate = useNavigate();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const start = new Date(a.start);
  // Bij een hele dag is het einde het begin van de volgende dag; de laatste dag is dus een dag eerder.
  const laatsteDag = a.heleDag ? plusDagen(new Date(a.einde), -1) : new Date(a.einde);
  const meerdereDagen = !zelfdeDag(start, laatsteDag);

  const verwijder = async () => {
    if (!window.confirm(`"${a.omschrijving}" verwijderen?`)) return;
    setBezig(true);
    setFout(null);
    try {
      await api.verwijderAfspraak(a.id);
      if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
      else navigate('/', { replace: true });
    } catch (e) {
      setFout(`Verwijderen is niet gelukt. (${e instanceof Error ? e.message : String(e)})`);
      setBezig(false);
    }
  };

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/" label="Agenda" />
      <PaginaKop
        sub={`${dagTitel(start)}${a.heleDag ? ' · Hele dag' : ` · ${tijdvak(a.start, a.einde)}`}`}
        titel={a.omschrijving}
      />
      <OfflineRegel resultaat={resultaat} />
      <div className="les__labels">
        <LesLabel label="eigen" />
      </div>

      {tekst && (
        <Sectie titel="Beschrijving">
          <section className="kaart lestekst">{tekst}</section>
        </Sectie>
      )}

      <Sectie titel="Afspraak">
        <section className="kaart">
          <GegevenRij label={meerdereDagen ? 'Van' : 'Datum'} waarde={dagTitel(start)} />
          <GegevenRij label="Tot en met" waarde={meerdereDagen ? dagTitel(laatsteDag) : undefined} />
          <GegevenRij label="Tijd" waarde={a.heleDag ? 'Hele dag' : tijdvak(a.start, a.einde)} />
          <GegevenRij label="Locatie" waarde={a.lokaal ?? undefined} />
          <GegevenRij label="Toegevoegd" waarde={a.aangemaaktOp ? datumEnTijd(a.aangemaaktOp) : undefined} />
          <GegevenRij label="Laatst gewijzigd" waarde={a.gewijzigdOp ? datumEnTijd(a.gewijzigdOp) : undefined} />
        </section>
      </Sectie>

      {fout && (
        <p className="formulier-fout" role="alert">
          {fout}
        </p>
      )}
      <Link to="bewerken" className="knop-primair">
        <Pencil size={18} strokeWidth={2.2} aria-hidden="true" />
        Bewerken
      </Link>
      <button type="button" className="knop-verwijderen" onClick={verwijder} disabled={bezig}>
        {bezig ? 'Bezig met verwijderen…' : 'Afspraak verwijderen'}
      </button>
    </div>
  );
}
