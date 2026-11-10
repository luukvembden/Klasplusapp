import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api, type Afspraak, type Label } from '../api';
import { LesLabel } from '../components/agenda/LesLabel';
import { LesRij } from '../components/agenda/LesRij';
import { CijferRij } from '../components/cijfers/CijferRij';
import { HuiswerkRij } from '../components/huiswerk/HuiswerkRij';
import { BijgewerktBalk } from '../components/ui/BijgewerktBalk';
import { Sectie } from '../components/ui/Sectie';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useCijfers } from '../hooks/useCijfers';
import { useLaden } from '../hooks/useLaden';
import { beginVanDag, dagEnMaand, dagNaam, plusDagen, weekNummer, zelfdeDag } from '../lib/datum';
import { nieuwVandaag } from '../lib/nieuweCijfers';
import { useOngelezen } from '../lib/ongelezen';
import { metHoofdletter } from '../lib/tekst';
import '../components/agenda/agenda.css';
import '../components/huiswerk/huiswerk.css';
import '../components/meer/meer.css';
import '../components/ui/ui.css';

/** Labels die betekenen dat er iets te doen of te leren is (zoals bij Huiswerk). */
const TAAK: Label[] = ['huiswerk', 'proefwerk', 'tentamen', 'so', 'mondeling'];
const TOETS: Label[] = ['proefwerk', 'tentamen', 'so', 'mondeling'];
const heeftTaak = (a: Afspraak) => !!a.inhoudHtml || a.labels.some((l) => TAAK.includes(l));
const isToets = (a: Afspraak) => a.labels.some((l) => TOETS.includes(l));
const vervalt = (a: Afspraak) => a.labels.includes('vervalt');

/** "over 45 min", "over 1 uur en 10 min" */
function overMinuten(min: number): string {
  if (min < 60) return `${min} min`;
  const uur = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${uur} uur en ${rest} min` : `${uur} uur`;
}

/** "Morgen", "Maandag", of bij verder weg "Maandag 17 november". */
function dagWoord(dag: Date, vandaag: Date): string {
  const verschil = Math.round((dag.getTime() - vandaag.getTime()) / 86_400_000);
  if (verschil === 0) return 'Vandaag';
  if (verschil === 1) return 'Morgen';
  if (verschil < 7) return dagNaam(dag);
  return `${dagNaam(dag)} ${dagEnMaand(dag)}`;
}

/** Een toets later deze week: vak, en welke dag. Tik voor de opdracht, net als bij Huiswerk. */
function ToetsRij({ afspraak: a, vandaag }: { afspraak: Afspraak; vandaag: Date }) {
  return (
    <Link to={`/huiswerk/${encodeURIComponent(a.id)}`} className="huiswerkrij">
      <div className="huiswerkrij__tekst">
        <span className="huiswerkrij__vak">{metHoofdletter(a.vak ?? a.omschrijving)}</span>
        <span className="huiswerkrij__inhoud">
          {dagWoord(beginVanDag(new Date(a.start)), vandaag)}
          {a.lesuur ? ` · ${a.lesuur}e uur` : ''}
        </span>
      </div>
      <div className="huiswerkrij__rechts">
        {a.labels
          .filter((l) => TOETS.includes(l))
          .map((l) => (
            <LesLabel key={l} label={l} afgerond={a.afgerond} />
          ))}
      </div>
      <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
    </Link>
  );
}

/** De klok, elke halve minuut bijgewerkt: genoeg voor "nog 12 min". */
function useNu(): Date {
  const [nu, setNu] = useState(() => new Date());
  useEffect(() => {
    const klok = setInterval(() => setNu(new Date()), 30_000);
    return () => clearInterval(klok);
  }, []);
  return nu;
}

/**
 * Home: in één scherm wat je nu hebt en wat er daarna komt. Het scherm beweegt mee met de dag:
 * voor school je eerste les en de toetsen van vandaag, op school de les van nu en de volgende,
 * na school (en in het weekend) alles voor de volgende schooldag.
 */
export function Home() {
  const nu = useNu();
  const vandaag = beginVanDag(nu);
  const dagSleutel = vandaag.getTime();
  const geladen = useLaden(() => api.afspraken(vandaag, plusDagen(vandaag, 15)), [dagSleutel]);
  const { cijfers, profiel, vernieuw: vernieuwCijfers } = useCijfers();
  const ongelezen = useOngelezen();

  const alles = useMemo(
    () => [...(geladen.data?.data ?? [])].filter((a) => !a.heleDag).sort((a, b) => a.start.localeCompare(b.start)),
    [geladen.data],
  );
  const opDag = (dag: Date) => alles.filter((a) => zelfdeDag(new Date(a.start), dag));
  const lessen = (dag: Date) => opDag(dag).filter((a) => !vervalt(a));

  const nieuw = useMemo(
    () => (cijfers && profiel ? nieuwVandaag(cijfers, profiel.ouder ? String(profiel.ouder.gekozen) : 'ik') : new Set<string>()),
    [cijfers, profiel],
  );
  const nieuweCijfers = (cijfers ?? []).filter((c) => nieuw.has(c.id));

  // Waar staan we vandaag: voor de eerste les, op school, of klaar (ook: geen les vandaag).
  const vandaagLessen = lessen(vandaag);
  const eerste = vandaagLessen[0];
  const laatste = vandaagLessen[vandaagLessen.length - 1];
  const t = nu.getTime();
  const moment: 'voor' | 'school' | 'na' =
    !eerste || t >= new Date(laatste.einde).getTime() ? 'na' : t < new Date(eerste.start).getTime() ? 'voor' : 'school';

  // De volgende schooldag: de eerste dag na vandaag met lessen.
  const volgendeDag = (() => {
    for (let i = 1; i <= 14; i++) {
      const dag = plusDagen(vandaag, i);
      if (opDag(dag).length) return dag;
    }
    return null;
  })();
  // Voor en tijdens school gaat "morgen" over de volgende schooldag; na school ook.
  const doelDag = volgendeDag;

  const huidige = vandaagLessen.find((a) => new Date(a.start).getTime() <= t && t < new Date(a.einde).getTime());
  const volgende = vandaagLessen.find((a) => new Date(a.start).getTime() > t);
  const minTot = (iso: string) => Math.max(1, Math.round((new Date(iso).getTime() - t) / 60_000));

  const takenDoel = doelDag ? opDag(doelDag).filter(heeftTaak) : [];
  const openDoel = takenDoel.filter((a) => !a.afgerond);
  const vervaltDoel = doelDag ? opDag(doelDag).filter(vervalt) : [];
  const eersteDoel = doelDag ? lessen(doelDag)[0] : undefined;

  // Toetsen in de komende week, behalve vandaag en de dag die hierboven al staat.
  const weekEinde = plusDagen(vandaag, 8);
  const latereToetsen = alles.filter((a) => {
    const d = new Date(a.start);
    return isToets(a) && d < weekEinde && !zelfdeDag(d, vandaag) && !(doelDag && zelfdeDag(d, doelDag));
  });

  const klaar = geladen.data && !geladen.laden && !geladen.fout;
  const vernieuw = () => Promise.all([geladen.vernieuw(), vernieuwCijfers()]).then(() => undefined);

  return (
    <div className="huiswerk">
      <header className="agendakop">
        <div className="agendakop__tekst">
          <h1 className="agendakop__titel">{dagNaam(nu)}</h1>
          <span className="agendakop__sub">
            {dagEnMaand(nu)} · week {weekNummer(nu)}
          </span>
        </div>
      </header>

      <div className="agenda__midden">
        <div className="huiswerk__lijst" aria-busy={geladen.laden}>
          <VegenOmTeVernieuwen onVernieuw={vernieuw}>
            <div className="pagina home">
              {geladen.fout && <p className="melding">{geladen.fout}</p>}

              {/* Voor school: je eerste les, en welke toetsen je vandaag hebt. */}
              {moment === 'voor' && eerste && (
                <>
                  <Sectie titel={`Eerste les · over ${overMinuten(minTot(eerste.start))}`}>
                    <section className="kaart home__lessen">
                      <LesRij afspraak={eerste} />
                    </section>
                  </Sectie>
                  {vandaagLessen.some((a) => isToets(a) && a !== eerste) && (
                    <Sectie titel="Toetsen vandaag">
                      <section className="kaart home__lessen">
                        {vandaagLessen
                          .filter((a) => isToets(a) && a !== eerste)
                          .map((a) => (
                            <LesRij key={a.id} afspraak={a} />
                          ))}
                      </section>
                    </Sectie>
                  )}
                  {opDag(vandaag).some((a) => heeftTaak(a) && !a.afgerond && !isToets(a)) && (
                    <Sectie titel="Nog niet afgevinkt voor vandaag">
                      <section className="kaart">
                        {opDag(vandaag)
                          .filter((a) => heeftTaak(a) && !a.afgerond && !isToets(a))
                          .map((a) => (
                            <HuiswerkRij key={a.id} afspraak={a} />
                          ))}
                      </section>
                    </Sectie>
                  )}
                </>
              )}

              {/* Op school: de les van nu (met het nu-lijntje) en de volgende. */}
              {moment === 'school' && (huidige || volgende) && (
                <Sectie
                  titel={
                    huidige
                      ? `Nu · nog ${overMinuten(minTot(huidige.einde))}`
                      : `Volgende les · over ${overMinuten(minTot(volgende!.start))}`
                  }
                >
                  <section className="kaart home__lessen">
                    {huidige && <LesRij afspraak={huidige} />}
                    {volgende && <LesRij afspraak={volgende} />}
                  </section>
                </Sectie>
              )}

              {/* Na school, in het weekend en in de vakantie: de volgende schooldag. */}
              {moment === 'na' && doelDag && eersteDoel && (
                <Sectie titel={`${dagWoord(doelDag, vandaag)} · eerste les`}>
                  <section className="kaart home__lessen">
                    <LesRij afspraak={eersteDoel} />
                  </section>
                </Sectie>
              )}
              {moment === 'na' && vervaltDoel.length > 0 && (
                <p className="home__let-op">
                  {vervaltDoel
                    .map((a) => `${a.lesuur ? `Het ${a.lesuur}e uur` : 'Een les'} (${metHoofdletter(a.vak ?? a.omschrijving)})`)
                    .join(', ')}{' '}
                  {vervaltDoel.length === 1 ? 'vervalt' : 'vervallen'} {doelDag ? dagWoord(doelDag, vandaag).toLowerCase() : ''}.
                </p>
              )}
              {moment === 'na' && klaar && !doelDag && (
                <p className="melding">Geen lessen in de komende twee weken.</p>
              )}

              {/* Huiswerk en toetsen voor de volgende schooldag. */}
              {doelDag && takenDoel.length > 0 && (
                <Sectie
                  titel={
                    moment === 'na'
                      ? `Nog doen voor ${dagWoord(doelDag, vandaag).toLowerCase()}`
                      : `Voor ${dagWoord(doelDag, vandaag).toLowerCase()}`
                  }
                >
                  <section className="kaart">
                    {(moment === 'na' && openDoel.length ? openDoel : takenDoel).map((a) => (
                      <HuiswerkRij key={a.id} afspraak={a} />
                    ))}
                    {moment === 'na' && openDoel.length === 0 && (
                      <p className="home__klaar">Alles is afgevinkt.</p>
                    )}
                  </section>
                </Sectie>
              )}

              {latereToetsen.length > 0 && (
                <Sectie titel="Toetsen komende week">
                  <section className="kaart">
                    {latereToetsen.map((a) => (
                      <ToetsRij key={a.id} afspraak={a} vandaag={vandaag} />
                    ))}
                  </section>
                </Sectie>
              )}

              {nieuweCijfers.length > 0 && (
                <Sectie titel="Nieuw">
                  <Link to="/cijfers" className="kaart home__cijfers">
                    {nieuweCijfers.map((c) => (
                      <CijferRij key={c.id} cijfer={c} nieuw />
                    ))}
                  </Link>
                </Sectie>
              )}

              {ongelezen > 0 && (
                <section className="kaart">
                  <Link to="/meer/berichten" className="opdrachtrij">
                    <span className="opdrachtrij__tekst">
                      <span className="opdrachtrij__vak">
                        {ongelezen === 1 ? '1 ongelezen bericht' : `${ongelezen} ongelezen berichten`}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
                  </Link>
                </section>
              )}
            </div>
          </VegenOmTeVernieuwen>
        </div>
      </div>

      <BijgewerktBalk resultaat={geladen.data} />
    </div>
  );
}
