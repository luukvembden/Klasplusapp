import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { vergeetGeladen } from '../hooks/useLaden';
import { haalVanSchool, zetOpSchool } from '../lib/leerplanSchool';
import { Invoerrij } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { soortVan, useAfspraak } from '../hooks/useAfspraak';
import { beginVanDag, dagKort, dagTitel, korteDatum, naarInvoer, plusDagen, vanInvoer } from '../lib/datum';
import { useLagen } from '../lib/laag';
import { bewaarLeerplan, leerplanVoor, verwijderLeerplan, type Leermoment } from '../lib/leerplan';
import { controleerNu } from '../lib/notificaties';
import { metHoofdletter } from '../lib/tekst';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/instellingen/instellingen.css';
import '../components/leren/leren.css';

/** Langer van tevoren dan dit kun je niet kiezen. */
const MAX_DAGEN = 21;
const STANDAARD_TIJD = '19:00';

const DUREN = [
  { naam: '15 min', minuten: 15 },
  { naam: '30 min', minuten: 30 },
  { naam: '45 min', minuten: 45 },
  { naam: '1 uur', minuten: 60 },
  { naam: '1,5 uur', minuten: 90 },
  { naam: '2 uur', minuten: 120 },
];

/** De datums waarop je leert: van `dagen` dagen voor de toets tot de dag ervoor, niet in het verleden. */
function datumsVoor(toetsDag: Date, dagen: number): string[] {
  const vandaag = beginVanDag(new Date());
  return Array.from({ length: dagen }, (_, i) => plusDagen(toetsDag, -(dagen - i)))
    .filter((d) => d.getTime() >= vandaag.getTime())
    .map(naarInvoer);
}

/**
 * Leren plannen voor een toets, zo eenvoudig mogelijk: één kaart met hoeveel dagen, hoe laat en hoe lang,
 * daaronder de dagen (aan/uit, eigen tijd, notitie). De leermomenten komen in je Agenda en op school.
 */
export function LerenPlannen() {
  const { id = '' } = useParams();
  const { afspraak: a, fout } = useAfspraak(id);
  const navigate = useNavigate();
  const lagen = useLagen();
  const bestaand = leerplanVoor(id);

  // Bij huiswerk plan je wanneer je het maakt; bij een toets wanneer je leert.
  const maken = !!a && soortVan(a) === 'Huiswerk';
  const toetsDag = a ? beginVanDag(new Date(a.start)) : null;
  const vandaag = beginVanDag(new Date());
  const ruimte = toetsDag ? Math.round((toetsDag.getTime() - vandaag.getTime()) / 86_400_000) : 0;
  const max = Math.min(MAX_DAGEN, ruimte);

  const [dagen, setDagen] = useState<number | null>(bestaand?.dagen ?? null);
  const [duur, setDuur] = useState<number | null>(bestaand?.duur ?? null);
  // Een ouder kan geen afspraken in de agenda van het kind zetten.
  const kanOpSchool = !api.isOuder();
  const [bezig, setBezig] = useState(false);
  const [tijden, setTijden] = useState<Record<string, Omit<Leermoment, 'datum'>>>(() =>
    Object.fromEntries((bestaand?.momenten ?? []).map(({ datum, ...rest }) => [datum, rest])),
  );
  const [alle, setAlle] = useState(STANDAARD_TIJD);
  const [melding, setMelding] = useState<string | null>(null);

  // Nog niets gekozen: bij huiswerk standaard de dag ervoor en een half uur, bij een toets 5 dagen en 45 minuten.
  const gekozenDagen = dagen ?? (maken ? 1 : 5);
  const gekozenDuur = duur ?? (maken ? 30 : 45);

  // Past het niet in het gekozen aantal dagen (bijvoorbeeld een toets over 3 dagen), dan zoveel als er zijn.
  useEffect(() => {
    if (max > 0 && gekozenDagen > max) setDagen(max);
  }, [max, gekozenDagen]);

  const kiesDagen = useCallback((n: number) => setDagen(n), []);
  const datums = toetsDag ? datumsVoor(toetsDag, Math.min(gekozenDagen, Math.max(max, 1))) : [];
  const momentVan = (datum: string) => tijden[datum] ?? { tijd: alle, aan: true };
  const zet = (datum: string, deel: Partial<Omit<Leermoment, 'datum'>>) =>
    setTijden((t) => ({ ...t, [datum]: { ...momentVan(datum), ...deel } }));

  const terug = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      if (!lagen?.terug()) navigate(-1);
    } else navigate('/huiswerk');
  };

  const opslaan = async () => {
    if (!a) return;
    // Wat je hier kiest geldt: de duur van het plan, en nieuwe afspraken op school (ids volgen hieronder).
    const momenten = datums.map((datum) => {
      const { tijd: t, aan, notitie } = momentVan(datum);
      return { datum, tijd: t, aan, notitie };
    });
    if (!momenten.some((m) => m.aan)) {
      setMelding('Zet minstens één dag aan.');
      return;
    }
    const plan = {
      toetsId: id,
      vak: metHoofdletter(a.vak ?? a.omschrijving),
      soort: soortVan(a),
      toetsStart: a.start,
      dagen: gekozenDagen,
      duur: gekozenDuur,
      momenten,
      // Elke dag heeft een notitieveld; leeg blijft leeg.
      notities: true,
      // Herinneringen voor leermomenten staan uit (meldingen werken nog niet betrouwbaar genoeg).
      herinnering: false,
      // Altijd ook in de schoolagenda (behalve voor een ouder).
      opSchool: kanOpSchool,
      schoolIds: bestaand?.schoolIds ?? [],
    };
    // Eerst op dit toestel bewaren, zodat er niets verloren gaat als de school niet bereikbaar is.
    bewaarLeerplan(plan);
    setBezig(true);
    setMelding(null);
    let gelukt = true;
    try {
      const perDatum = plan.opSchool ? await zetOpSchool(plan, plan.schoolIds) : (await haalVanSchool(plan.schoolIds), {});
      bewaarLeerplan({
        ...plan,
        momenten: plan.momenten.map((m) => (perDatum[m.datum] ? { ...m, schoolId: perDatum[m.datum] } : m)),
        schoolIds: Object.values(perDatum),
      });
    } catch (e) {
      gelukt = false;
      setMelding(
        `Je plan staat in Klas+, maar niet in de schoolagenda: ${e instanceof Error ? e.message : 'de school gaf een fout'}. Probeer het later nog eens.`,
      );
    } finally {
      setBezig(false);
    }
    vergeetGeladen();
    void controleerNu(true);
    if (gelukt) terug();
  };

  const wis = async () => {
    setBezig(true);
    await haalVanSchool(bestaand?.schoolIds ?? []);
    verwijderLeerplan(id);
    vergeetGeladen();
    void controleerNu(true);
    setBezig(false);
    terug();
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar={`/huiswerk/${encodeURIComponent(id)}`} label="Terug" />
        <PaginaKop
          sub={
            a
              ? `${soortVan(a)} · ${metHoofdletter(a.vak ?? a.omschrijving)} · ${dagKort(new Date(a.start))} ${korteDatum(a.start)}`
              : ' '
          }
          titel={maken ? 'Huiswerk inplannen' : 'Leren plannen'}
        />
      </VasteKop>
      {fout && <p className="melding">{fout}</p>}

      {a && max < 1 && (
        <p className="melding">
          {maken ? 'Dit huiswerk is voor vandaag' : 'Deze toets is vandaag'} of al geweest; er valt niets meer te plannen.
        </p>
      )}

      {a && max >= 1 && (
        <>
          {/* Alle keuzes in één kaart; tik op een waarde en de telefoon opent zijn eigen keuzewiel of lijst. */}
          <section className="kaart">
            <Invoerrij label="Aantal dagen" voor="leren-dagen">
              <select
                id="leren-dagen"
                className="invoerrij__veld invoerrij__keuze"
                value={Math.min(gekozenDagen, max)}
                onChange={(e) => kiesDagen(Number(e.target.value))}
              >
                {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Invoerrij>
            <Invoerrij label="Tijd" voor="leren-alle">
              <input
                id="leren-alle"
                type="time"
                className="invoerrij__veld"
                value={alle}
                onChange={(e) => {
                  const t = e.target.value;
                  if (!t) return;
                  setAlle(t);
                  setTijden((oud) =>
                    Object.fromEntries(datums.map((d) => [d, { ...(oud[d] ?? { aan: true }), tijd: t }])),
                  );
                }}
              />
            </Invoerrij>
            <Invoerrij label="Hoe lang" voor="leren-duur">
              <select
                id="leren-duur"
                className="invoerrij__veld invoerrij__keuze"
                value={gekozenDuur}
                onChange={(e) => setDuur(Number(e.target.value))}
              >
                {[...DUREN, ...(DUREN.some((d) => d.minuten === gekozenDuur) ? [] : [{ naam: `${gekozenDuur} min`, minuten: gekozenDuur }])]
                  .sort((x, y) => x.minuten - y.minuten)
                  .map((d) => (
                    <option key={d.minuten} value={d.minuten}>
                      {d.naam}
                    </option>
                  ))}
              </select>
            </Invoerrij>
          </section>

          <Sectie titel="Dagen">
            <section className="kaart">
              {datums.map((datum) => {
                const m = momentVan(datum);
                const d = vanInvoer(datum)!;
                return (
                  <div key={datum} className="leren__dagblok">
                    <div className={`leren__dag${m.aan ? '' : ' leren__dag--uit'}`}>
                      <label className="instelrij" htmlFor={`leren-aan-${datum}`} style={{ border: 'none', minHeight: 0 }}>
                        <input
                          id={`leren-aan-${datum}`}
                          type="checkbox"
                          checked={m.aan}
                          onChange={(e) => zet(datum, { aan: e.target.checked })}
                        />
                      </label>
                      <span className="leren__dagnaam">{dagTitel(d)}</span>
                      <input
                        type="time"
                        className="leren__tijd"
                        aria-label={`Tijd op ${dagTitel(d)}`}
                        value={m.tijd}
                        disabled={!m.aan}
                        onChange={(e) => e.target.value && zet(datum, { tijd: e.target.value })}
                      />
                    </div>
                    {m.aan && (
                      <input
                        type="text"
                        className="leren__notitie"
                        aria-label={`Notitie voor ${dagTitel(d)}`}
                        placeholder={maken ? 'Wat ga je maken? (optioneel)' : 'Wat ga je leren? (optioneel)'}
                        value={m.notitie ?? ''}
                        onChange={(e) => zet(datum, { notitie: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}
            </section>
          </Sectie>

          {melding && <p className="melding">{melding}</p>}

          <button type="button" className="knop-primair" onClick={opslaan} disabled={bezig}>
            {bezig ? 'Bezig…' : bestaand ? 'Bijwerken' : 'Inplannen'}
          </button>
          {bestaand && (
            <button type="button" className="knop-verwijderen" onClick={wis} disabled={bezig}>
              Plan verwijderen
            </button>
          )}
        </>
      )}
    </div>
  );
}
