import { Link } from 'react-router-dom';
import type { Afspraak } from '../../api';
import { dagKort, nlTijd, plusDagen, tijd, zelfdeDag } from '../../lib/datum';
import './agenda.css';

/** Zoveel pixels per minuut: een les van 50 minuten is dan 55px hoog. */
const PX_PER_MINUUT = 1.1;

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

interface Props {
  maandag: Date;
  /** Alle afspraken van deze week (ook die van het weekend). */
  afspraken: Afspraak[];
  /** De gekozen dag uit de dagstrook; die kolom krijgt een iets donkerder vlak. */
  gekozen: Date;
}

/**
 * De hele week in één raster, op tijd: elke les is zo hoog als hij duurt, zodat pauzes en tussenuren
 * als gat te zien zijn. Gewone lessen zijn wit, een gewijzigde les (ander lokaal, andere docent) heeft
 * de accentkleur en een vervallen les is doorgestreept. Tik op een les voor de lesinformatie.
 */
export function WeekRooster({ maandag, afspraken, gekozen }: Props) {
  const getimed = afspraken.filter((a) => !a.heleDag);
  // Ma–vr altijd; zaterdag en zondag alleen als daar iets staat.
  const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(maandag, i)).filter(
    (d, i) => i < 5 || getimed.some((a) => zelfdeDag(new Date(a.start), d)),
  );
  const perDag = dagen.map((d) =>
    getimed.filter((a) => zelfdeDag(new Date(a.start), d)).sort((a, b) => a.start.localeCompare(b.start)),
  );

  if (getimed.length === 0) return <p className="melding">Geen lessen in deze week.</p>;

  const van = Math.min(...getimed.map((a) => minuutVanDag(a.start)));
  const tot = Math.max(...getimed.map((a) => Math.max(minuutVanDag(a.einde), minuutVanDag(a.start) + 15)));
  const hoogte = (tot - van) * PX_PER_MINUUT;
  const y = (minuut: number) => (minuut - van) * PX_PER_MINUUT;

  // Links langs de rand: het lesuur en de begintijd, één keer per begintijd die in de week voorkomt.
  const assen = new Map<number, { tijd: string; uur: number | null }>();
  for (const a of getimed) {
    const m = minuutVanDag(a.start);
    const bekend = assen.get(m);
    if (!bekend || (bekend.uur === null && a.lesuur)) assen.set(m, { tijd: tijd(new Date(a.start)), uur: a.lesuur });
  }

  const kolommen = { gridTemplateColumns: `30px repeat(${dagen.length}, minmax(0, 1fr))` };

  return (
    <div className="weekrooster">
      <div className="weekrooster__koppen" style={kolommen}>
        <span />
        {dagen.map((d) => (
          <span
            key={d.getTime()}
            className={`weekrooster__kop${zelfdeDag(d, gekozen) ? ' weekrooster__kop--gekozen' : ''}`}
          >
            {dagKort(d)}
            <b>{nlTijd(d).dag}</b>
          </span>
        ))}
      </div>

      <div className="weekrooster__raster" style={{ ...kolommen, height: hoogte }}>
        <div className="weekrooster__as" aria-hidden="true">
          {[...assen].map(([m, { tijd: t, uur }]) => (
            <span key={m} className="weekrooster__astijd" style={{ top: y(m) }}>
              {uur && <b>{uur}</b>}
              {t}
            </span>
          ))}
        </div>

        {dagen.map((d, i) => {
          const plek = banen(perDag[i]);
          return (
            <div
              key={d.getTime()}
              className={`weekrooster__dag${zelfdeDag(d, gekozen) ? ' weekrooster__dag--gekozen' : ''}`}
            >
              {perDag[i].map((a) => {
                const s = minuutVanDag(a.start);
                const e = minuutVanDag(a.einde);
                const { baan, van: aantal } = plek.get(a.id) ?? { baan: 0, van: 1 };
                const { titel, docent } = kort(a);
                const vervalt = a.labels.includes('vervalt');
                const gewijzigd = !vervalt && a.labels.includes('gewijzigd');
                return (
                  <Link
                    key={a.id}
                    to={`/agenda/${encodeURIComponent(a.id)}`}
                    className={`weekles${vervalt ? ' weekles--vervalt' : ''}${gewijzigd ? ' weekles--gewijzigd' : ''}`}
                    style={{
                      top: y(s) + 1,
                      height: Math.max(y(e) - y(s) - 2, 18),
                      left: `calc(${(baan / aantal) * 100}% + ${baan ? 1 : 0}px)`,
                      width: `calc(${100 / aantal}% - ${aantal > 1 ? 1 : 0}px)`,
                    }}
                    aria-label={`${titel}, ${tijd(new Date(a.start))} tot ${tijd(new Date(a.einde))}${
                      a.lokaal ? `, ${a.lokaal}` : ''
                    }${vervalt ? ', vervalt' : gewijzigd ? ', gewijzigd' : ''}`}
                  >
                    <b>{titel}</b>
                    {a.lokaal && <span>{a.lokaal}</span>}
                    {docent && <span>{docent}</span>}
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
