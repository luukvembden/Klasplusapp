import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AfgerondSchakelaar } from '../components/les/AfgerondSchakelaar';
import { ChevronRight } from 'lucide-react';
import { LesLabel } from '../components/agenda/LesLabel';
import { GegevenRij } from '../components/les/GegevenRij';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { soortVan, useAfspraak } from '../hooks/useAfspraak';
import { dagTitel, korteDatumTijd, tijdvak } from '../lib/datum';
import { metHoofdletter } from '../lib/tekst';
import { EigenAfspraakScherm } from './EigenAfspraakScherm';
import '../components/les/les.css';

/** Lesinformatie: alles over één les, en een voorproefje van het huiswerk of de toets. */
export function Les() {
  const { id = '' } = useParams();
  const { afspraak: a, tekst, fout, data } = useAfspraak(id);
  // Na het (un)vinken meteen de nieuwe stand tonen, zonder opnieuw te laden.
  const [gewijzigd, setGewijzigd] = useState<boolean | null>(null);
  const afgerond = gewijzigd ?? a?.afgerond ?? false;

  // Zelf gemaakte afspraken krijgen hun eigen scherm, met bewerken en verwijderen.
  if (a?.labels.includes('eigen')) return <EigenAfspraakScherm afspraak={a} tekst={tekst} resultaat={data} />;

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/" label="Agenda" />
      <PaginaKop
        sub={a ? `${dagTitel(new Date(a.start))} · ${tijdvak(a.start, a.einde)}` : ' '}
        titel={a ? metHoofdletter(a.vak ?? a.omschrijving) : 'Lesinformatie'}
      />
      <OfflineRegel resultaat={data} />
      {fout && <p className="melding">{fout}</p>}

      {a && a.labels.length > 0 && (
        <div className="les__labels">
          {a.labels.map((l) => (
            <LesLabel key={l} label={l} afgerond={afgerond} />
          ))}
        </div>
      )}

      {a && tekst && (
        <Sectie titel={soortVan(a)}>
          <Link to="inhoud" className="kaart inhoudkaart">
            <div className="inhoudkaart__links">
              {/* Lege regels weg, zodat er in drie regels zoveel mogelijk tekst past. */}
              <p className="inhoudkaart__tekst">{tekst.replace(/\n{2,}/g, '\n')}</p>
              <p className="inhoudkaart__datums">
                Aangemaakt {a.aangemaaktOp ? korteDatumTijd(a.aangemaaktOp) : 'onbekend'}
                <br />
                Laatst gewijzigd {a.gewijzigdOp ? korteDatumTijd(a.gewijzigdOp) : 'onbekend'}
              </p>
            </div>
            <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
          </Link>
          <AfgerondSchakelaar id={a.id} afgerond={afgerond} onWijzig={setGewijzigd} />
        </Sectie>
      )}

      {a && (
        <Sectie titel="Les">
          <section className="kaart">
            <GegevenRij label="Lesuur" waarde={a.lesuur ? `${a.lesuur}e uur` : undefined} />
            <GegevenRij label="Tijd" waarde={tijdvak(a.start, a.einde)} />
            <GegevenRij label="Lokaal" waarde={a.lokaal ?? undefined} />
            <GegevenRij label="Vak" waarde={a.vak ? metHoofdletter(a.vak) : undefined} />
            <GegevenRij label={a.docenten.length > 1 ? 'Docenten' : 'Docent'} waarde={a.docenten.join(', ')} />
            <GegevenRij label="Groep" waarde={a.groepen.join(', ')} />
            <GegevenRij label="Omschrijving" waarde={a.omschrijving} />
          </section>
        </Sectie>
      )}
    </div>
  );
}
