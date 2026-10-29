import {
  demoAfwezigheden,
  demoCijfers,
  demoDocenten,
  demoInhoud,
  demoKinderen,
  demoMeldingen,
  demoLesuren,
  demoOuder,
  demoProfiel,
  demoRedenen,
  demoVakken,
  demoWeek,
  type DemoLes,
} from '../data/demo';
import { naarInvoer, nlMoment, nlTijd, plusDagen, vanInvoer } from '../lib/datum';
import { alleEigen, alsAfspraak, verwijderEigen, voegToe, werkBij } from '../lib/eigenAfspraken';
import { lees, schrijf, verwijder } from '../lib/opslag';
import { bewaarMelding, meldingenVan } from '../lib/meldingen';
import type { SchoolApi } from './SchoolApi';
import type { Afspraak, AfspraakDetail, Resultaat } from './types';

const SESSIE = 'sessie';
/** Bij de demo als ouder: welk kind gekozen is. */
interface DemoSessie {
  demo: true;
  kindId?: number;
}
const sessie = () => lees<DemoSessie>(SESSIE);
/** Gezet door het inlogscherm voordat het inloggen begint. */
let alsOuder = false;

/** Alleen voor de demo: de volgende keer inloggen als ouder in plaats van als leerling. */
export function demoAlsOuder(ouder: boolean) {
  alsOuder = ouder;
}

function alleenLeerling() {
  if (sessie()?.kindId !== undefined) throw new Error('Dit kan alleen de leerling zelf');
}

/** Doet alsof er een netwerk tussen zit: laadtijd, en een fout als het toestel offline is. */
async function vertraging(ms = 250) {
  if (!navigator.onLine) throw new Error('Geen internetverbinding');
  await new Promise((klaar) => setTimeout(klaar, ms));
}

const resultaat = <T>(data: T): Resultaat<T> => ({ data, opgehaaldOp: new Date().toISOString() });

const opTijd = (dag: Date, tijd: string) => {
  const [uur, minuut] = tijd.split(':').map(Number);
  const n = nlTijd(dag);
  return nlMoment(n.jaar, n.maand, n.dag, uur, minuut).toISOString();
};

/** Ids van afgevinkt huiswerk in de demo. */
const AFGEROND = 'demo.afgerond';
const afgevinkt = () => new Set(lees<string[]>(AFGEROND) ?? []);

function lesOp(dag: Date, les: DemoLes): Afspraak {
  const [start, einde] = demoLesuren[les.uur - 1];
  // "NE – DV – 4V2" → vakcode NE en docentcode DV.
  const [vakCode, docentCode] = les.omschrijving.split(' – ');
  // Datum en uur in het id, zodat afspraak(id) de les terug kan vinden.
  const id = `${naarInvoer(dag)}_${les.uur}`;
  return {
    id,
    afgerond: afgevinkt().has(id),
    start: opTijd(dag, start),
    einde: opTijd(dag, einde),
    lesuur: les.uur,
    omschrijving: les.omschrijving,
    lokaal: les.lokaal,
    labels: les.labels,
    vak: demoVakken[vakCode] ?? null,
    docenten: demoDocenten[docentCode] ? [demoDocenten[docentCode]] : [],
    inhoudHtml: demoInhoud[les.labels.find((l) => l in demoInhoud)!] ?? null,
  };
}

const lessenOp = (dag: Date) => demoWeek[(nlTijd(dag).weekdag + 6) % 7].map((les) => lesOp(dag, les));

export const demoApi: SchoolApi = {
  async start() {},

  async inloggen() {
    await vertraging();
    schrijf(SESSIE, (alsOuder ? { demo: true, kindId: demoKinderen[0].id } : { demo: true }) satisfies DemoSessie);
  },

  async uitloggen() {
    verwijder(SESSIE);
  },

  heeftSessie() {
    return sessie() !== null;
  },

  isOuder: () => sessie()?.kindId !== undefined,

  async kiesKind(id) {
    await vertraging(150);
    schrijf(SESSIE, { demo: true, kindId: id } satisfies DemoSessie);
  },

  async profiel() {
    await vertraging();
    const kindId = sessie()?.kindId;
    if (kindId === undefined) return resultaat(demoProfiel);
    const kind = demoKinderen.find((k) => k.id === kindId) ?? demoKinderen[0];
    return resultaat({
      ...demoProfiel,
      ...demoOuder,
      klas: kind.klas,
      ouder: { kinderen: demoKinderen.map(({ id, naam, initialen }) => ({ id, naam, initialen })), gekozen: kind.id },
    });
  },

  async afspraken(van, tot) {
    await vertraging();
    const lijst: Afspraak[] = [];
    for (let dag = new Date(van); dag < tot; dag = plusDagen(dag, 1)) lijst.push(...lessenOp(dag));
    // Eigen afspraken die (deels) in deze periode vallen; in de demo staan die op het toestel.
    // Een ouder ziet ze niet: die zijn van het kind zelf.
    if (sessie()?.kindId === undefined) {
      lijst.push(...alleEigen().filter((a) => new Date(a.start) < tot && new Date(a.einde) > van).map(alsAfspraak));
    }
    return resultaat(lijst);
  },

  async afspraak(id) {
    await vertraging(150);
    const eigen = alleEigen().find((a) => a.id === id);
    if (eigen) {
      return resultaat<AfspraakDetail>({
        ...alsAfspraak(eigen),
        inhoudHtml: eigen.beschrijving ? `<p>${eigen.beschrijving.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` : null,
        aangemaaktOp: eigen.aangemaaktOp,
        gewijzigdOp: eigen.gewijzigdOp ?? null,
        groepen: [],
      });
    }
    const [datum, uur] = id.split('_');
    const dag = vanInvoer(datum);
    const les = dag && lessenOp(dag).find((a) => a.lesuur === Number(uur));
    if (!les) throw new Error('Les niet gevonden');
    const soort = les.inhoudHtml;
    const detail: AfspraakDetail = {
      ...les,
      // Doet alsof de docent het een week eerder invoerde en twee dagen later aanpaste.
      aangemaaktOp: soort ? plusDagen(new Date(les.start), -7).toISOString() : null,
      gewijzigdOp: soort ? plusDagen(new Date(les.start), -5).toISOString() : null,
      groepen: les.omschrijving.includes('4V2') ? ['4V2'] : [],
    };
    return resultaat(detail);
  },

  async maakAfspraak(invoer) {
    alleenLeerling();
    await vertraging();
    voegToe(invoer);
  },

  async wijzigAfspraak(id, invoer) {
    alleenLeerling();
    await vertraging();
    werkBij(id, invoer);
  },

  async zetAfgerond(id, afgerond) {
    alleenLeerling();
    await vertraging(150);
    const lijst = afgevinkt();
    if (afgerond) lijst.add(id);
    else lijst.delete(id);
    schrijf(AFGEROND, [...lijst]);
  },

  async verwijderAfspraak(id) {
    alleenLeerling();
    await vertraging();
    verwijderEigen(id);
  },

  async afwezigheden() {
    await vertraging();
    return resultaat(demoAfwezigheden);
  },

  async meldOpties() {
    await vertraging(150);
    // In de demo meldt alleen de ouder, met de redenen zoals een school ze kan instellen.
    // Een leerling ziet de meldingen wel, maar kan zelf niet melden.
    const ouder = sessie()?.kindId !== undefined;
    return { kanMelden: ouder, redenen: ouder ? demoRedenen : [], alleenVandaagOfMorgen: false, meldingenVanSchool: true };
  },

  async meldAfwezig(melding) {
    await vertraging();
    const kindId = sessie()?.kindId;
    if (kindId === undefined) throw new Error('Afwezig melden kan niet voor dit account');
    bewaarMelding(kindId, melding);
  },

  async meldingen() {
    await vertraging();
    // Wat in de demo is gemeld komt bij het eerste kind, dat ook de demo-leerling is.
    const kindId = sessie()?.kindId ?? demoKinderen[0].id;
    return resultaat([...meldingenVan(kindId), ...demoMeldingen].sort((a, b) => b.start.localeCompare(a.start)));
  },

  async cijfers() {
    await vertraging();
    return resultaat(demoCijfers);
  },
};
