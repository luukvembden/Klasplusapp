import { useRef, useState } from 'react';
import { api, type Afspraak, type Label } from '../api';
import { HuiswerkRij } from '../components/huiswerk/HuiswerkRij';
import { WeekStrook } from '../components/huiswerk/WeekStrook';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { Sectie } from '../components/ui/Sectie';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useLaden } from '../hooks/useLaden';
import { useVeeg } from '../hooks/useVeeg';
import { dagTitel, maandagVan, naarInvoer, plusDagen, zelfdeDag } from '../lib/datum';
import '../components/agenda/agenda.css';
import '../components/huiswerk/huiswerk.css';
import '../components/ui/ui.css';

/** Labels die betekenen dat er iets te doen of te leren is. */
const TAAK: Label[] = ['huiswerk', 'proefwerk', 'tentamen', 'so', 'mondeling'];
const heeftTaak = (a: Afspraak) => !!a.inhoudHtml || a.labels.some((l) => TAAK.includes(l));

/** "deze week", "volgende week", "vorige week", of anders "over 3 weken" / "2 weken geleden". */
function weekInWoorden(week: Date): string {
  const verschil = Math.round((week.getTime() - maandagVan(new Date()).getTime()) / (7 * 86_400_000));
  if (verschil === 0) return 'deze week';
  if (verschil === 1) return 'volgende week';
  if (verschil === -1) return 'vorige week';
  return verschil > 0 ? `over ${verschil} weken` : `${-verschil} weken geleden`;
}

/** Huiswerk en toetsen van een week, per dag en per vak. */
export function Huiswerk() {
  // Via de tabbalk begint Huiswerk altijd op deze week; terug uit een opdracht blijft de week staan.
  const [week, zetWeek] = useState(() => maandagVan(new Date()));
  const kies = (d: Date) => zetWeek(maandagVan(d));

  // Over de lijst vegen: naar links is de volgende week, naar rechts de vorige.
  const lijst = useRef<HTMLDivElement>(null);
  useVeeg({ naarLinks: () => kies(plusDagen(week, 7)), naarRechts: () => kies(plusDagen(week, -7)) }, lijst);

  const geladen = useLaden(() => api.afspraken(week, plusDagen(week, 7)), [week.getTime()]);
  const taken = (geladen.data?.data ?? []).filter(heeftTaak).sort((a, b) => a.start.localeCompare(b.start));

  // Per dag groeperen, in volgorde van de week.
  const perDag = new Map<string, Afspraak[]>();
  for (const a of taken) {
    const dag = naarInvoer(new Date(a.start));
    perDag.set(dag, [...(perDag.get(dag) ?? []), a]);
  }
  const klaar = geladen.data && !geladen.laden && !geladen.fout;
  const dezeWeek = zelfdeDag(week, maandagVan(new Date()));

  return (
    <div className="huiswerk">
      <header className="agendakop">
        <div className="agendakop__tekst">
          <h1 className="agendakop__titel">Huiswerk</h1>
          <span className="agendakop__sub">{weekInWoorden(week)}</span>
        </div>
        {!dezeWeek && (
          <div className="agendakop__knoppen">
            <button type="button" className="agendakop__vandaag" onClick={() => kies(new Date())}>
              Deze week
            </button>
          </div>
        )}
      </header>
      <WeekStrook week={week} onKies={kies} />

      <div className="huiswerk__lijst" ref={lijst} aria-busy={geladen.laden}>
        <VegenOmTeVernieuwen onVernieuw={geladen.vernieuw}>
          <div className="pagina">
            {geladen.fout && <p className="melding">{geladen.fout}</p>}
            {klaar && taken.length === 0 && <p className="melding">Geen huiswerk of toetsen deze week.</p>}
            {[...perDag.entries()].map(([dag, lijst]) => (
              <Sectie key={dag} titel={dagTitel(new Date(dag))}>
                <section className="kaart">
                  {lijst.map((a) => (
                    <HuiswerkRij key={a.id} afspraak={a} />
                  ))}
                </section>
              </Sectie>
            ))}
          </div>
        </VegenOmTeVernieuwen>
      </div>

      <BijgewerktBalk resultaat={geladen.data} />
    </div>
  );
}
