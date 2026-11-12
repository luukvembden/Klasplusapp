import { Link } from 'react-router-dom';
import { lesLink } from '../../lib/leerplan';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Afspraak } from '../../api';
import { dagKort, nlTijd, plusDagen, tijd, zelfdeDag } from '../../lib/datum';
import './agenda.css';

/** Zoveel pixels per minuut: een les van 50 minuten is dan 55px hoog. */
const PX_PER_MINUUT = 1.1;
/** Zo lang is een gewone les; ook de hoogte van een blok in de late rij. */
const LES_MINUTEN = 50;
/** Zonder lessen: zo hoog is één vak van vier uur in het vaste kader (08–12, 12–16, 16–20, 20–24). */
const KADER_VAK_PX = 75;

const minuutVanDag = (iso: string) => {
  const n = nlTijd(new Date(iso));
  return n.uur * 60 + n.minuut;
};

/** "NE – DV – 4V2" → "NE"; een eigen afspraak houdt zijn titel. */
function kort(a: Afspraak): { titel: string; docent: string | null } {
  if (a.labels.includes('eigen')) return { titel: a.omschrijving, docent: null };
  const delen = a.omschrijving.split(' – ');
  return { titel: delen[0], docent: delen.length >= 3 ? delen[1] : null };
}

/** Lessen die tegelijk zijn komen naast elkaar: per les de baan en hoeveel banen er in die groep zijn. */
function banen(lessen: Afspraak[]): Map<string, { baan: number; van: number }> {
  const uit = new Map<string, { baan: number; van: number }>();
  let groep: { a: Afspraak; baan: number }[] = [];
  let groepEinde = -1;
  const sluit = () => {
    const aantal = Math.max(1, ...groep.map((g) => g.baan + 1));
    for (const g of groep) uit.set(g.a.id, { baan: g.baan, van: aantal });
    groep = [];
  };
  for (const a of lessen) {
    const s = minuutVanDag(a.start);
    const e = minuutVanDag(a.einde);
    if (s >= groepEinde) sluit();
    // De eerste baan die vrij is op het begin van deze les.
    const bezet = new Set(groep.filter((g) => minuutVanDag(g.a.einde) > s).map((g) => g.baan));
    let baan = 0;
    while (bezet.has(baan)) baan++;
    groep.push({ a, baan });
    groepEinde = Math.max(groepEinde, e);
  }
  sluit();
  return uit;
}

/**
 * Zelfde kolommen voor de rij met dagen (in de kop) en het rooster eronder: links de tijden (in de kop
 * het pijltje terug), dan de dagen, rechts een smalle kolom (in de kop het pijltje vooruit).
 */
const kolommenVoor = (aantal: number) => ({ gridTemplateColumns: `30px repeat(${aantal}, minmax(0, 1fr)) 22px` });

/**
 * De rij met dagen boven het rooster ("ma 9", "di 10" …), met pijltjes naar de vorige en volgende week.
 * Staat in de kop van de Agenda, op dezelfde hoogte als de dagstrook van de dagweergave. De dagen zijn
 * alleen tekst; vandaag heeft een grijs vlakje en een nummer in de accentkleur.
 */
export function WeekKoppen({ dagen, onVorige, onVolgende }: { dagen: Date[]; onVorige: () => void; onVolgende: () => void }) {
  const vandaag = new Date();
  return (
    <div className="weekrooster__koppen" style={kolommenVoor(dagen.length)}>
      <button type="button" className="weekrooster__pijl" aria-label="Vorige week" onClick={onVorige}>
        <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {dagen.map((d) => (
        <span
          key={d.getTime()}
          className={`weekrooster__kop${zelfdeDag(d, vandaag) ? ' weekrooster__kop--gekozen' : ''}`}
        >
          {dagKort(d)}
          <b>{nlTijd(d).dag}</b>
        </span>
      ))}
      <button type="button" className="weekrooster__pijl" aria-label="Volgende week" onClick={onVolgende}>
        <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Raakt deze afspraak dag `d`? Zelfde regel als in de dagweergave. */
export const opDag = (a: Afspraak, d: Date) =>
  new Date(a.start) < plusDagen(d, 1) && (new Date(a.einde) > d || zelfdeDag(new Date(a.start), d));

/**
 * Afspraken voor de hele dag: boven het rooster, als een balk over de dagen die ze raken. Liggen er
 * meer over dezelfde dagen, dan onder elkaar.
 */
function HeleDagen({ dagen, afspraken }: { dagen: Date[]; afspraken: Afspraak[] }) {
  if (afspraken.length === 0) return null;
  const rijen: number[] = []; // per rij: de laatste bezette dag
  const balken = [...afspraken]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((a) => {
      const raakt = dagen.map((d, i) => (opDag(a, d) ? i : -1)).filter((i) => i >= 0);
      if (raakt.length === 0) return null;
      const van = raakt[0];
      const tot = raakt[raakt.length - 1];
      let rij = rijen.findIndex((laatste) => laatste < van);
      if (rij < 0) rij = rijen.push(tot) - 1;
      else rijen[rij] = tot;
      return { a, van, tot, rij };
    })
    .filter((b) => b !== null);
  return (
    <div className="weekrooster__heledag" style={kolommenVoor(dagen.length)}>
      {balken.map(({ a, van, tot, rij }) => (
        <Link
          key={a.id}
          to={lesLink(a)}
          className="weekbalk"
          style={{ gridColumn: `${van + 2} / ${tot + 3}`, gridRow: rij + 1 }}
          aria-label={`${a.omschrijving}, hele dag`}
        >
          {a.omschrijving}
        </Link>
      ))}
    </div>
  );
}

interface Props {
  /** De dagen die naast elkaar staan: maandag tot en met vrijdag, of zaterdag en zondag. */
  dagen: Date[];
  /** De afspraken van die dagen. */
  afspraken: Afspraak[];
  /** Vandaag; die kolom krijgt een iets donkerder vlak. */
  gekozen: Date;
  /** Wat er staat als er niets is. */
  leeg: string;
  /** De les van nu, of in de pauze de volgende; die wordt groen (zelfde regel als in de dagweergave). */
  uitgelicht?: string | null;
}

/**
 * De hele week in één raster, op tijd: elke les is zo hoog als hij duurt, zodat pauzes en tussenuren
 * als gat te zien zijn. Gewone lessen zijn wit, de les van nu groen, een gewijzigde les (ander lokaal,
 * andere docent) paars en een vervallen les is doorgestreept. Tik op een les voor de lesinformatie.
 */
export function WeekRooster({ dagen, afspraken, gekozen, leeg, uitgelicht }: Props) {
  const getimed = afspraken.filter((a) => !a.heleDag);
  const perDag = dagen.map((d) =>
    getimed.filter((a) => zelfdeDag(new Date(a.start), d)).sort((a, b) => a.start.localeCompare(b.start)),
  );
  const heleDagen = <HeleDagen dagen={dagen} afspraken={afspraken.filter((a) => a.heleDag)} />;

  if (getimed.length === 0) {
    return afspraken.length ? <div className="weekrooster">{heleDagen}</div> : <p className="melding">{leeg}</p>;
  }

  // Het schoolrooster staat altijd op de echte tijd. Eigen afspraken en leermomenten die pas na de
  // laatste les van de week beginnen, komen compact daaronder: na één leeg vak, op volgorde van tijd,
  // elk zo hoog als een les. Zo hoef je niet ver naar beneden voor iets om 19:00.
  const vanSchool = (a: Afspraak) => !a.labels.includes('eigen') && !a.labels.includes('leren');
  const school = getimed.filter(vanSchool);
  const schoolEinde = school.length ? Math.max(...school.map((a) => minuutVanDag(a.einde))) : Infinity;
  const isLaat = (a: Afspraak) => !vanSchool(a) && minuutVanDag(a.start) >= schoolEinde;
  const normaal = getimed.filter((a) => !isLaat(a));
  const laat = getimed.filter(isLaat);

  // Geen enkele les in dit blok (weekend, vakantie): een vast kader van 08:00 tot 24:00 in vier vakken van
  // vier uur, zodat iets om 19:00 ook echt 's avonds staat en niet helemaal bovenaan.
  const kader = school.length === 0;
  const eerste = Math.min(...normaal.map((a) => minuutVanDag(a.start)));
  const van = kader ? Math.min(8 * 60, Math.floor(eerste / 60) * 60) : eerste;
  const tot = kader
    ? 24 * 60
    : Math.max(...normaal.map((a) => Math.max(minuutVanDag(a.einde), minuutVanDag(a.start) + 15)));
  const schaal = kader ? KADER_VAK_PX / (4 * 60) : PX_PER_MINUUT;
  const y = (minuut: number) => (minuut - van) * schaal;
  // De grenzen van de vakken in het kader: 08:00, 12:00, 16:00 en 20:00 (en eerder als er iets vroegs is).
  const grenzen = kader ? [...(van < 8 * 60 ? [van] : []), 8 * 60, 12 * 60, 16 * 60, 20 * 60] : [];
  const RIJ = LES_MINUTEN * PX_PER_MINUUT;
  const laatTijden = [...new Set(laat.map((a) => minuutVanDag(a.start)))].sort((p, q) => p - q);
  const laatY = (minuut: number) => y(tot) + RIJ + laatTijden.indexOf(minuut) * RIJ;
  const hoogte = laat.length ? laatY(laatTijden[laatTijden.length - 1]) + RIJ : y(tot);

  /** Boven- en onderkant van een blok: echt op tijd, of in de compacte rij onderaan. */
  const plekVan = (a: Afspraak) => {
    if (isLaat(a)) return { top: laatY(minuutVanDag(a.start)) + 1, hoogte: RIJ - 2 };
    const s = minuutVanDag(a.start);
    const e = minuutVanDag(a.einde);
    // In het vaste kader is een uur maar klein; een afspraak blijft daar minstens zo hoog als een les,
    // zodat titel en tijd goed leesbaar zijn. Hij begint wel op de echte tijd.
    return { top: y(s) + 1, hoogte: Math.max(y(e) - y(s) - 2, kader ? RIJ - 2 : 18) };
  };

  // Links langs de rand: het lesuur en de begintijd, één keer per begintijd die in de week voorkomt.
  const assen = new Map<number, { tijd: string; uur: number | null; top: number }>();
  for (const m of grenzen) assen.set(m, { tijd: `${String(Math.floor(m / 60)).padStart(2, '0')}:00`, uur: null, top: y(m) });
  for (const a of kader ? [] : getimed) {
    const m = minuutVanDag(a.start);
    const bekend = assen.get(m);
    const top = isLaat(a) ? laatY(m) : y(m);
    if (!bekend || (bekend.uur === null && a.lesuur)) assen.set(m, { tijd: tijd(new Date(a.start)), uur: a.lesuur, top });
  }

  const kolommen = kolommenVoor(dagen.length);

  return (
    <div className="weekrooster">
      {heleDagen}
      <div className="weekrooster__raster" style={{ ...kolommen, height: hoogte }}>
        {grenzen.map((m) => (
          <span key={`lijn-${m}`} className="weekrooster__lijn" style={{ top: y(m) }} aria-hidden="true" />
        ))}
        <div className="weekrooster__as" aria-hidden="true">
          {[...assen].map(([m, { tijd: t, uur, top }]) => (
            <span key={m} className="weekrooster__astijd" style={{ top }}>
              {uur && <b>{uur}</b>}
              {t}
            </span>
          ))}
        </div>

        {dagen.map((d, i) => {
          // Naast elkaar als ze tegelijk zijn; de late rij per tijdstip apart.
          const plek = banen(perDag[i].filter((a) => !isLaat(a)));
          for (const m of laatTijden) {
            const samen = perDag[i].filter((a) => isLaat(a) && minuutVanDag(a.start) === m);
            samen.forEach((a, baan) => plek.set(a.id, { baan, van: samen.length }));
          }
          return (
            <div
              key={d.getTime()}
              className={`weekrooster__dag${zelfdeDag(d, gekozen) ? ' weekrooster__dag--gekozen' : ''}`}
            >
              {perDag[i].map((a) => {
                const { top, hoogte: h } = plekVan(a);
                const { baan, van: aantal } = plek.get(a.id) ?? { baan: 0, van: 1 };
                const { titel, docent } = kort(a);
                const vervalt = a.labels.includes('vervalt');
                const nu = !vervalt && a.id === uitgelicht;
                const gewijzigd = !vervalt && !nu && a.labels.includes('gewijzigd');
                // Lang blok (zoals een excursie): tekst mag per heel woord naar de volgende regel, en
                // "BTME,KNNW" wordt "BTME, KNNW" zodat elke afkorting een eigen regel kan krijgen.
                const lang = h >= 2 * RIJ;
                const woorden = (t: string) => (lang ? t.replace(/\s*,\s*/g, ', ') : t);
                return (
                  <Link
                    key={a.id}
                    to={lesLink(a)}
                    className={`weekles${vervalt ? ' weekles--vervalt' : ''}${gewijzigd ? ' weekles--gewijzigd' : ''}${nu ? ' weekles--nu' : ''}${h < 34 ? ' weekles--klein' : ''}${lang ? ' weekles--lang' : ''}`}
                    style={{
                      top,
                      height: h,
                      left: `calc(${(baan / aantal) * 100}% + ${baan ? 1 : 0}px)`,
                      width: `calc(${100 / aantal}% - ${aantal > 1 ? 1 : 0}px)`,
                    }}
                    aria-label={`${titel}, ${tijd(new Date(a.start))} tot ${tijd(new Date(a.einde))}${
                      a.lokaal ? `, ${a.lokaal}` : ''
                    }${vervalt ? ', vervalt' : gewijzigd ? ', gewijzigd' : ''}`}
                  >
                    <b>{titel}</b>
                    {/* Zonder lesuur (eigen afspraak) de tijden erbij; die staan dan niet langs de rand. */}
                    {!a.lesuur && <span>{tijd(new Date(a.start))} – {tijd(new Date(a.einde))}</span>}
                    {a.lokaal && <span>{woorden(a.lokaal)}</span>}
                    {docent && <span>{woorden(docent)}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
