import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, type Afspraak } from '../api';
import { AgendaKop } from '../components/agenda/AgendaKop';
import { DagStrook } from '../components/agenda/DagStrook';
import { LesRij } from '../components/agenda/LesRij';
import { WeekKoppen, WeekRooster } from '../components/agenda/WeekRooster';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { VeegCarrousel } from '../components/ui/VeegCarrousel';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useInstellingen } from '../lib/instellingen';
import { metLeermomenten, useLeerplannen } from '../lib/leerplan';
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

  /** De werkweek (ma–vr) als rooster; ook voor de buurweken in de schuifbaan. */
  const roosterVan = (ma: Date) => {
    const dagen = Array.from({ length: 5 }, (_, i) => plusDagen(ma, i));
    const einde = plusDagen(ma, 5);
    const lessen = alleAfspraken.filter((a) => new Date(a.start) >= ma && new Date(a.start) < einde);
    if (!weekGeladen && lessen.length === 0) return null;
    // De les van nu (of in de pauze de volgende) komt uit de lessen van vandaag, als vandaag in deze week valt.
    const vandaag = new Date(nu);
    const licht = uitgelicht(lessen.filter((a) => zelfdeDag(new Date(a.start), vandaag)));
    return (
      <WeekRooster
        dagen={dagen}
        afspraken={lessen}
        gekozen={vandaag}
        leeg="Geen lessen in deze week."
        uitgelicht={licht}
      />
    );
  };

  // De weekweergave laat alleen werkweken zien: staat de Agenda op een zaterdag of zondag, dan de week erna.
  useEffect(() => {
    if (perWeek && !isWeekdag(dag)) setDag(plusDagen(maandagVan(dag), 7));
  }, [perWeek, dag]);

  /** Naar een andere week: vandaag als die erin valt, anders de maandag. */
  const naarWeek = (ma: Date) => {
    const vandaag = beginVanDag(new Date());
    setDag(maandagVan(vandaag).getTime() === ma.getTime() && isWeekdag(vandaag) ? vandaag : ma);
  };

  return (
    <div className="agenda">
      {/* Lichte kop zoals de andere tabbladen; in de dagweergave de dagen eronder. */}
      <div className="agendakop-vlak">
        {/* In de weekweergave geen dagkiezer: je veegt per week, en de dagen staan boven het rooster. */}
        <AgendaKop
          dag={dag}
          bereik={perWeek ? [maandag, plusDagen(maandag, 4)] : undefined}
          onNaarNu={() => (perWeek ? naarWeek(maandagVan(new Date())) : setDag(beginVanDag(new Date())))}
        />
        {/* De dagen staan in beide weergaven op dezelfde hoogte, direct onder de kop. */}
        {perWeek ? (
          <div className="agenda__weekkoppen">
            <WeekKoppen
              dagen={Array.from({ length: 5 }, (_, i) => plusDagen(maandag, i))}
              onVorige={() => naarWeek(plusDagen(maandag, -7))}
              onVolgende={() => naarWeek(plusDagen(maandag, 7))}
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
              // Vegen in de weekweergave: naar de vorige of volgende week.
              <VeegCarrousel
                sleutel={naarInvoer(maandag)}
                vorige={roosterVan(plusDagen(maandag, -7))}
                huidige={roosterVan(maandag)}
                volgende={roosterVan(plusDagen(maandag, 7))}
                onVorige={() => naarWeek(plusDagen(maandag, -7))}
                onVolgende={() => naarWeek(plusDagen(maandag, 7))}
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
