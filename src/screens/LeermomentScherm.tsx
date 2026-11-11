import { Link, useParams } from 'react-router-dom';
import { LesLabel } from '../components/agenda/LesLabel';
import { GegevenRij } from '../components/les/GegevenRij';
import { opMoment } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { dagTitel, tijd } from '../lib/datum';
import { isMaken, lerenTitel, notitieVan, useLeerplannen } from '../lib/leerplan';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/afwezigheid/afwezigheid.css';
import '../components/leren/leren.css';

/** "45 minuten", "1 uur", "1,5 uur" */
function duurTekst(minuten: number): string {
  if (minuten < 60) return `${minuten} minuten`;
  const uren = minuten / 60;
  return `${String(uren).replace('.', ',')} uur`;
}

/**
 * Eén leer- of huiswerkmoment uit een plan, in dezelfde opbouw als een les: titel, label, notitie en
 * de gegevens. Onderaan de knop naar het hele plan (en naar de toets of het huiswerk zelf).
 */
export function LeermomentScherm() {
  const { id = '', datum = '' } = useParams();
  const plannen = useLeerplannen();
  const plan = plannen[id];
  const moment = plan?.momenten.find((m) => m.datum === datum && m.aan);

  if (!plan || !moment) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar="/" label="Agenda" />
        <PaginaKop sub=" " titel="Niet gevonden" />
        <p className="melding">Dit moment staat niet (meer) in je planning.</p>
      </div>
    );
  }

  const maken = isMaken(plan);
  const start = opMoment(moment.datum, moment.tijd);
  const minuten = moment.duur ?? plan.duur;
  const einde = new Date(start.getTime() + minuten * 60_000);
  const notitie = notitieVan(plan, moment);
  const toets = new Date(plan.toetsStart);
  const aantal = plan.momenten.filter((m) => m.aan).length;
  const welke = plan.momenten.filter((m) => m.aan).findIndex((m) => m.datum === datum) + 1;

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/" label="Agenda" />
      <PaginaKop sub={`${dagTitel(start)} · ${tijd(start)} – ${tijd(einde)}`} titel={lerenTitel(plan)} />
      <div className="les__labels">
        <LesLabel label={maken ? 'eigen' : 'leren'} />
      </div>

      {notitie && (
        <Sectie titel="Notitie">
          <section className="kaart lestekst">{notitie}</section>
        </Sectie>
      )}

      <Sectie titel={maken ? 'Huiswerkmoment' : 'Leermoment'}>
        <section className="kaart">
          <GegevenRij label="Datum" waarde={dagTitel(start)} />
          <GegevenRij label="Tijd" waarde={`${tijd(start)} – ${tijd(einde)}`} />
          <GegevenRij label="Duur" waarde={duurTekst(minuten)} />
          <GegevenRij label="Moment" waarde={aantal > 1 ? `${welke} van ${aantal}` : undefined} />
          {/* Het vak staat al in de titel; hier alleen wanneer de toets of het huiswerk is. */}
          <GegevenRij label={maken ? 'Huiswerk voor' : plan.soort} waarde={dagTitel(toets)} />
          <GegevenRij label="Schoolagenda" waarde={plan.schoolIds?.length ? 'Staat erin' : undefined} />
        </section>
      </Sectie>

      <Link to={`/leren/${encodeURIComponent(id)}`} className="knop-primair">
        {maken ? 'Bekijk planning' : 'Bekijk leerplan'}
      </Link>
      <Link to={`/huiswerk/${encodeURIComponent(id)}`} className="knop-secundair leermoment__knop">
        {maken ? 'Naar het huiswerk' : `Naar de ${plan.soort === 'SO' ? 'SO' : 'toets'}`}
      </Link>
    </div>
  );
}
