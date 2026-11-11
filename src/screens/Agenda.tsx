import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, type Afspraak } from '../api';
import { AgendaKop } from '../components/agenda/AgendaKop';
import { DagStrook } from '../components/agenda/DagStrook';
import { LesRij } from '../components/agenda/LesRij';
import { WeekRooster } from '../components/agenda/WeekRooster';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { VeegCarrousel } from '../components/ui/VeegCarrousel';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useInstellingen } from '../lib/instellingen';
import { useLaagZichtbaar } from '../lib/laag';
import { beginVanDag, isWeekdag, maandagVan, naarInvoer, plusDagen, zelfdeDag } from '../lib/datum';
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
  const { indeling } = useInstellingen();
  const perWeek = indeling === 'week';

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

  // Openen in het weekend zonder afspraken (vandaag t/m zondag leeg): meteen naar maandag.
  // Eén keer per keer openen, en alleen zolang je nog niet zelf een andere dag koos.
  const weekendBekeken = useRef(false);
  useEffect(() => {
    if (weekendBekeken.current || !weekGeladen) return;
    weekendBekeken.current = true;
    const vandaag = beginVanDag(new Date());
    const weekdag = vandaag.getDay(); // 6 = zaterdag, 0 = zondag
    if (!zelfdeDag(dag, vandaag) || (weekdag !== 6 && weekdag !== 0)) return;
    const restVanWeekend = weekdag === 6 ? [vandaag, plusDagen(vandaag, 1)] : [vandaag];
    if (restVanWeekend.every((d) => lessenOp(d).length === 0)) setDag(plusDagen(vandaag, weekdag === 6 ? 2 : 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alleen zodra de week voor het eerst geladen is
  }, [weekGeladen]);

  // De huidige tijd, elke halve minuut bijgewerkt, om de les van nu uit te lichten.
  const [nu, setNu] = useState(() => Date.now());
  useEffect(() => {
    const klok = setInterval(() => setNu(Date.now()), 30_000);
    return () => clearInterval(klok);
  }, []);

  /**
   * Welke les is uitgelicht: de les die nu bezig is, of in een pauze of tussenuur de volgende les.
   * Voor de eerste les en na de laatste niets. Hele-dag-afspraken tellen niet mee.
   */
  const uitgelicht = (lessen: Afspraak[]): string | null => {
    const getimed = lessen.filter((a) => !a.heleDag);
    if (getimed.length === 0 || nu < new Date(getimed[0].start).getTime()) return null;
    const bezig = getimed.find((a) => new Date(a.start).getTime() <= nu && nu < new Date(a.einde).getTime());
    return (bezig ?? getimed.find((a) => new Date(a.start).getTime() > nu))?.id ?? null;
  };

  /** De lessen van één dag, zoals in de lijst; ook voor de buurdagen in de schuifbaan. */
  const dagLijst = (d: Date) => {
    const lessen = lessenOp(d);
    const licht = zelfdeDag(d, new Date(nu)) ? uitgelicht(lessen) : null;
    return (
      <>
        {lessen.length > 0 && (
          <section className="agenda__kaart">
            {lessen.map((a) => (
              <LesRij key={a.id} afspraak={a} bezig={a.id === licht} />
            ))}
          </section>
        )}
        {weekGeladen && lessen.length === 0 && <p className="melding">Geen afspraken op deze dag.</p>}
      </>
    );
  };

  /**
   * Een blok in de weekweergave als rooster: de werkweek (ma–vr, vijf kolommen) of het weekend
   * (za en zo, twee kolommen). Ook voor de buurblokken in de schuifbaan.
   */
  const roosterVan = (start: Date) => {
    const weekend = !isWeekdag(start);
    const dagen = Array.from({ length: weekend ? 2 : 5 }, (_, i) => plusDagen(start, i));
    const einde = plusDagen(start, dagen.length);
    const lessen = (week.data?.data ?? []).filter((a) => new Date(a.start) >= start && new Date(a.start) < einde);
    if (!weekGeladen && lessen.length === 0) return null;
    return (
      <WeekRooster
        dagen={dagen}
        afspraken={lessen}
        gekozen={new Date()}
        leeg={weekend ? 'Geen afspraken in het weekend.' : 'Geen lessen in deze week.'}
      />
    );
  };

  // In de weekweergave wissel je tussen blokken: werkweek (ma–vr), weekend (za–zo), volgende werkweek.
  const isWeekend = (d: Date) => !isWeekdag(d);
  const blokStart = (d: Date) => (isWeekend(d) ? plusDagen(maandagVan(d), 5) : maandagVan(d));
  const blok = blokStart(dag);
  const vorigBlok = (start: Date) => plusDagen(start, isWeekend(start) ? -5 : -2);
  const volgendBlok = (start: Date) => plusDagen(start, isWeekend(start) ? 2 : 5);
  /** Naar een ander blok: vandaag als die erin valt, anders de eerste dag ervan. */
  const naarBlok = (start: Date) => {
    const vandaag = beginVanDag(new Date());
    setDag(blokStart(vandaag).getTime() === start.getTime() ? vandaag : start);
  };

  return (
    <div className="agenda">
      {/* Kop en dagstrook samen in één gekleurd blok, met witte tekst en een witte cirkel om de gekozen dag. */}
      <div className="agendakop-vlak">
        {/* In de weekweergave geen dagkiezer: je veegt per week, en de dagen staan boven het rooster. */}
        <AgendaKop dag={dag} bereik={perWeek ? [blok, plusDagen(blok, isWeekend(blok) ? 1 : 4)] : undefined} />
        {!perWeek && <DagStrook dag={dag} onKies={setDag} />}
      </div>

      <div className="agenda__midden">
        <div className="agenda__lijst" ref={lijstVlak} aria-busy={week.laden}>
          <VegenOmTeVernieuwen onVernieuw={week.vernieuw}>
            {week.fout && <p className="melding">{week.fout}</p>}
            {/* Vegen over de lessen: naar links de volgende dag, naar rechts de vorige, en je ziet hem binnenschuiven. */}
            {perWeek ? (
              // Vegen in de weekweergave: werkweek, weekend, volgende werkweek.
              <VeegCarrousel
                sleutel={naarInvoer(blok)}
                vorige={roosterVan(vorigBlok(blok))}
                huidige={roosterVan(blok)}
                volgende={roosterVan(volgendBlok(blok))}
                onVorige={() => naarBlok(vorigBlok(blok))}
                onVolgende={() => naarBlok(volgendBlok(blok))}
                vlak={lijstVlak}
              />
            ) : (
              <VeegCarrousel
                sleutel={naarInvoer(dag)}
                vorige={dagLijst(plusDagen(dag, -1))}
                huidige={dagLijst(dag)}
                volgende={dagLijst(plusDagen(dag, 1))}
                onVorige={() => setDag(plusDagen(dag, -1))}
                onVolgende={() => setDag(plusDagen(dag, 1))}
                vlak={lijstVlak}
              />
            )}
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
