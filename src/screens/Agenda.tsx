import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, type Afspraak } from '../api';
import { AgendaKop } from '../components/agenda/AgendaKop';
import { DagStrook } from '../components/agenda/DagStrook';
import { LesRij } from '../components/agenda/LesRij';
import { opDag, WeekKoppen, WeekRooster } from '../components/agenda/WeekRooster';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { VeegCarrousel } from '../components/ui/VeegCarrousel';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useInstellingen } from '../lib/instellingen';
import { bewaarLeerplan, metLeermomenten, useLeerplannen, verwijderLeerplan, volgSchool } from '../lib/leerplan';
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
  // Leermomenten uit je leerplannen staan tussen de lessen (alleen op dit toestel).
  const plannen = useLeerplannen();

  // De schoolsite is leidend: is een leer- of huiswerkmoment daar aangepast of verwijderd, dan neemt
  // Klas+ dat over zodra de agenda vers is opgehaald (niet uit de bewaarde versie zonder verbinding).
  useEffect(() => {
    const geladen = week.data;
    if (!geladen || geladen.offline || week.laden) return;
    const van = plusDagen(maandag, -7);
    const tot = plusDagen(maandag, 14);
    for (const plan of Object.values(plannen)) {
      const nieuw = volgSchool(plan, geladen.data, van, tot);
      if (!nieuw) continue;
      if (nieuw.momenten.some((m) => m.aan)) bewaarLeerplan(nieuw);
      else verwijderLeerplan(plan.toetsId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alleen na een nieuwe lading van school
  }, [week.data]);
  // Staat een leermoment ook als persoonlijke afspraak op school, dan alleen de versie van Klas+ (die opent het plan).
  const alleAfspraken = useMemo(() => metLeermomenten(week.data?.data ?? [], plannen), [week.data, plannen]);
  // Vegen kan over de hele lijst, ook het lege stuk eronder tot aan de balk (het plusje ligt erbuiten).
  const lijstVlak = useRef<HTMLDivElement>(null);

  // Een afspraak hoort bij elke dag die hij (deels) raakt; eigen afspraken kunnen meerdere dagen duren.
  const lessenOp = (d: Date) => {
    const einde = plusDagen(d, 1);
    return alleAfspraken
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
   * Welke les is uitgelicht: de les (of afspraak) die nu bezig is, of anders de volgende als die binnen
   * een kwartier begint. Zo kleurt een pauze de volgende les, maar 's middags niet al iets van 19:00.
   * Hele-dag-afspraken tellen niet mee.
   */
  const uitgelicht = (lessen: Afspraak[]): string | null => {
    const getimed = lessen.filter((a) => !a.heleDag);
    const bezig = getimed.find((a) => new Date(a.start).getTime() <= nu && nu < new Date(a.einde).getTime());
    if (bezig) return bezig.id;
    const volgende = getimed
      .filter((a) => new Date(a.start).getTime() > nu)
      .sort((x, y) => x.start.localeCompare(y.start))[0];
    return volgende && new Date(volgende.start).getTime() - nu <= 15 * 60_000 ? volgende.id : null;
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
   * In de weekweergave wissel je tussen blokken: de werkweek (ma–vr, vijf kolommen), dan het weekend
   * (za en zo, twee bredere kolommen), dan de volgende werkweek. Een weekend zonder afspraken (geen
   * eigen afspraak via het plusje, geen leermoment) sla je over: dan ga je meteen naar de andere week.
   */
  const isWeekend = (d: Date) => !isWeekdag(d);
  const blokStart = (d: Date) => (isWeekend(d) ? plusDagen(maandagVan(d), 5) : maandagVan(d));
  const blokDagen = (start: Date) => (isWeekend(start) ? 2 : 5);
  /** De afspraken die je in een blok ziet: alles wat een van de dagen raakt (ook hele-dag-afspraken). */
  const afsprakenIn = (start: Date) => {
    const dagen = Array.from({ length: blokDagen(start) }, (_, i) => plusDagen(start, i));
    return alleAfspraken.filter((a) => dagen.some((d) => opDag(a, d)));
  };
  const weekendHeeftIets = (zaterdag: Date) => afsprakenIn(zaterdag).length > 0;
  const vorigBlok = (start: Date) => {
    if (isWeekend(start)) return plusDagen(start, -5);
    const zaterdag = plusDagen(start, -2);
    return weekendHeeftIets(zaterdag) ? zaterdag : plusDagen(start, -7);
  };
  const volgendBlok = (start: Date) => {
    if (isWeekend(start)) return plusDagen(start, 2);
    const zaterdag = plusDagen(start, 5);
    return weekendHeeftIets(zaterdag) ? zaterdag : plusDagen(start, 7);
  };
  /** "Naar nu": in een leeg weekend meteen de week erna. */
  const blokVanNu = () => {
    const start = blokStart(new Date());
    return isWeekend(start) && !weekendHeeftIets(start) ? plusDagen(start, 2) : start;
  };
  const blok = blokStart(dag);

  /** Een blok als rooster; ook voor de buurblokken in de schuifbaan. */
  const roosterVan = (start: Date) => {
    const weekend = isWeekend(start);
    const dagen = Array.from({ length: blokDagen(start) }, (_, i) => plusDagen(start, i));
    const lessen = afsprakenIn(start);
    if (!weekGeladen && lessen.length === 0) return null;
    // De les van nu (of de volgende binnen een kwartier) komt uit de afspraken van vandaag.
    const vandaag = new Date(nu);
    const licht = uitgelicht(lessen.filter((a) => zelfdeDag(new Date(a.start), vandaag)));
    return (
      <WeekRooster
        dagen={dagen}
        afspraken={lessen}
        gekozen={vandaag}
        leeg={weekend ? 'Geen afspraken in het weekend.' : 'Geen lessen in deze week.'}
        uitgelicht={licht}
      />
    );
  };

  /** Naar een ander blok: vandaag als die erin valt, anders de eerste dag ervan. */
  const naarBlok = (start: Date) => {
    const vandaag = beginVanDag(new Date());
    setDag(blokStart(vandaag).getTime() === start.getTime() ? vandaag : start);
  };

  return (
    <div className="agenda">
      {/* Lichte kop zoals de andere tabbladen; in de dagweergave de dagen eronder. */}
      <div className="agendakop-vlak">
        {/* In de weekweergave geen dagkiezer: je veegt per week, en de dagen staan boven het rooster. */}
        <AgendaKop
          dag={dag}
          bereik={perWeek ? [blok, plusDagen(blok, blokDagen(blok) - 1)] : undefined}
          onNaarNu={() => (perWeek ? naarBlok(blokVanNu()) : setDag(beginVanDag(new Date())))}
        />
        {/* De dagen staan in beide weergaven op dezelfde hoogte, direct onder de kop. */}
        {perWeek ? (
          <div className="agenda__weekkoppen">
            <WeekKoppen
              dagen={Array.from({ length: blokDagen(blok) }, (_, i) => plusDagen(blok, i))}
              onVorige={() => naarBlok(vorigBlok(blok))}
              onVolgende={() => naarBlok(volgendBlok(blok))}
            />
          </div>
        ) : (
          <DagStrook dag={dag} onKies={setDag} />
        )}
      </div>

      <div className="agenda__midden">
        <div className={`agenda__lijst${perWeek ? ' agenda__lijst--week' : ''}`} ref={lijstVlak} aria-busy={week.laden}>
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
