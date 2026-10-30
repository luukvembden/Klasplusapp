import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { AgendaKop } from '../components/agenda/AgendaKop';
import { DagStrook } from '../components/agenda/DagStrook';
import { LesRij } from '../components/agenda/LesRij';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { VeegCarrousel } from '../components/ui/VeegCarrousel';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useLaagZichtbaar } from '../lib/laag';
import { beginVanDag, maandagVan, naarInvoer, plusDagen, zelfdeDag } from '../lib/datum';
import '../components/ui/ui.css';
import '../components/agenda/agenda.css';

/** Een dag die de Agenda moet tonen zodra hij weer bovenop ligt, bijvoorbeeld na het opslaan van een afspraak. */
let gevraagdeDag: Date | null = null;

/** Laat de Agenda deze dag tonen, bijvoorbeeld na het opslaan van een nieuwe afspraak. */
export function toonDagInAgenda(dag: Date) {
  gevraagdeDag = beginVanDag(dag);
}

export function Agenda() {
  // Via de tabbalk begint de Agenda altijd op vandaag. Terug uit een les blijft de dag staan,
  // omdat de Agenda dan onder de les bleef liggen (zie AppLayout).
  const [dag, setDag] = useState(() => beginVanDag(new Date()));
  const zichtbaar = useLaagZichtbaar();
  useEffect(() => {
    if (!gevraagdeDag) return;
    setDag(gevraagdeDag);
    gevraagdeDag = null;
  }, [zichtbaar]);
  const maandag = maandagVan(dag);

  // De week plus de week ervoor en erna in één keer ophalen: wisselen tussen dagen gaat dan direct,
  // en bij het vegen staat de buurdag (ook over de weekgrens) al klaar.
  const week = useLaden(() => api.afspraken(plusDagen(maandag, -7), plusDagen(maandag, 14)), [maandag.getTime()]);
  const weekGeladen = week.data && !week.laden && !week.fout;
  // Vegen kan over de hele lijst, ook het lege stuk eronder tot aan de balk (het plusje ligt erbuiten).
  const lijstVlak = useRef<HTMLDivElement>(null);

  // Een afspraak hoort bij elke dag die hij (deels) raakt; eigen afspraken kunnen meerdere dagen duren.
  const lessenOp = (d: Date) => {
    const einde = plusDagen(d, 1);
    return (week.data?.data ?? [])
      .filter((a) => new Date(a.start) < einde && (new Date(a.einde) > d || zelfdeDag(new Date(a.start), d)))
      // Hele-dag-afspraken bovenaan, daarna op begintijd.
      .sort((a, b) => Number(!!b.heleDag) - Number(!!a.heleDag) || a.start.localeCompare(b.start));
  };

  /** De lessen van één dag, zoals in de lijst; ook voor de buurdagen in de schuifbaan. */
  const dagLijst = (d: Date) => {
    const lessen = lessenOp(d);
    return (
      <>
        {lessen.length > 0 && (
          <section className="agenda__kaart">
            {lessen.map((a) => (
              <LesRij key={a.id} afspraak={a} />
            ))}
          </section>
        )}
        {weekGeladen && lessen.length === 0 && <p className="melding">Geen afspraken op deze dag.</p>}
      </>
    );
  };

  return (
    <div className="agenda">
      <AgendaKop dag={dag} onKies={setDag} onVandaag={() => setDag(beginVanDag(new Date()))} />
      <DagStrook dag={dag} onKies={setDag} />

      <div className="agenda__midden">
        <div className="agenda__lijst" ref={lijstVlak} aria-busy={week.laden}>
          <VegenOmTeVernieuwen onVernieuw={week.vernieuw}>
            {week.fout && <p className="melding">{week.fout}</p>}
            {/* Vegen over de lessen: naar links de volgende dag, naar rechts de vorige, en je ziet hem binnenschuiven. */}
            <VeegCarrousel
              sleutel={naarInvoer(dag)}
              vorige={dagLijst(plusDagen(dag, -1))}
              huidige={dagLijst(dag)}
              volgende={dagLijst(plusDagen(dag, 1))}
              onVorige={() => setDag(plusDagen(dag, -1))}
              onVolgende={() => setDag(plusDagen(dag, 1))}
              vlak={lijstVlak}
            />
          </VegenOmTeVernieuwen>
        </div>

        {/* Afspraken toevoegen doet alleen de leerling zelf, niet een ouder. */}
        {!api.isOuder() && (
          <Link to={`/agenda/nieuw?dag=${naarInvoer(dag)}`} className="plusknop" aria-label="Afspraak toevoegen">
            <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        )}
      </div>

      <BijgewerktBalk resultaat={week.data} />
    </div>
  );
}
