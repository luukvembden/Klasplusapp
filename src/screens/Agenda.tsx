import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { AgendaKop } from '../components/agenda/AgendaKop';
import { DagStrook } from '../components/agenda/DagStrook';
import { LesRij } from '../components/agenda/LesRij';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useVeeg } from '../hooks/useVeeg';
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

  // Over de lessen vegen: naar links is de volgende dag, naar rechts de vorige.
  const midden = useRef<HTMLDivElement>(null);
  useVeeg({ naarLinks: () => setDag(plusDagen(dag, 1)), naarRechts: () => setDag(plusDagen(dag, -1)) }, midden);

  // De hele week in één keer ophalen, zodat wisselen tussen dagen direct gaat.
  const week = useLaden(() => api.afspraken(maandag, plusDagen(maandag, 7)), [maandag.getTime()]);

  // Een afspraak hoort bij elke dag die hij (deels) raakt; eigen afspraken kunnen meerdere dagen duren.
  const dagEinde = plusDagen(dag, 1);
  const lessen = (week.data?.data ?? [])
    .filter((a) => new Date(a.start) < dagEinde && (new Date(a.einde) > dag || zelfdeDag(new Date(a.start), dag)))
    // Hele-dag-afspraken bovenaan, daarna op begintijd.
    .sort((a, b) => Number(!!b.heleDag) - Number(!!a.heleDag) || a.start.localeCompare(b.start));
  const weekGeladen = week.data && !week.laden && !week.fout;

  return (
    <div className="agenda">
      <AgendaKop dag={dag} onKies={setDag} onVandaag={() => setDag(beginVanDag(new Date()))} />
      <DagStrook dag={dag} onKies={setDag} />

      <div className="agenda__midden" ref={midden}>
        <div className="agenda__lijst" aria-busy={week.laden}>
          <VegenOmTeVernieuwen onVernieuw={week.vernieuw}>
            {week.fout && <p className="melding">{week.fout}</p>}
            {lessen.length > 0 && (
              <section className="agenda__kaart">
                {lessen.map((a) => (
                  <LesRij key={a.id} afspraak={a} />
                ))}
              </section>
            )}
            {weekGeladen && lessen.length === 0 && <p className="melding">Geen afspraken op deze dag.</p>}
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
