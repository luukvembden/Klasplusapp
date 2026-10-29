import type { Afspraak, AfspraakInvoer } from '../api/types';
import { lees, schrijf, verwijder } from './opslag';

// Eigen afspraken in de demo (browser). In de telefoon-app gaan ze als persoonlijke
// afspraak naar de schoolserver; daar wordt deze opslag niet gebruikt.

export interface EigenAfspraak extends AfspraakInvoer {
  id: string;
  aangemaaktOp: string;
  /** Alleen als de afspraak na het toevoegen is aangepast. */
  gewijzigdOp?: string;
}

const SLEUTEL = 'eigen.afspraken';
const VOORVOEGSEL = 'eigen-';

let lijst: EigenAfspraak[] = lees<EigenAfspraak[]>(SLEUTEL) ?? [];

function bewaar(nieuw: EigenAfspraak[]) {
  lijst = nieuw;
  schrijf(SLEUTEL, lijst);
}

export const alleEigen = () => lijst;

export function voegToe(a: AfspraakInvoer): EigenAfspraak {
  const nieuw = { ...a, id: VOORVOEGSEL + crypto.randomUUID(), aangemaaktOp: new Date().toISOString() };
  bewaar([...lijst, nieuw]);
  return nieuw;
}

/** Past een bestaande afspraak aan; id en moment van toevoegen blijven hetzelfde. */
export function werkBij(id: string, a: AfspraakInvoer) {
  bewaar(lijst.map((x) => (x.id === id ? { ...x, ...a, gewijzigdOp: new Date().toISOString() } : x)));
}

export function verwijderEigen(id: string) {
  bewaar(lijst.filter((a) => a.id !== id));
}

/** Bij uitloggen: alles van deze leerling van het toestel. */
export function wisEigenAfspraken() {
  lijst = [];
  verwijder(SLEUTEL);
}

/** Zelfde vorm als een les, zodat de Agenda hem op dezelfde manier kan tonen. */
export function alsAfspraak(a: EigenAfspraak): Afspraak {
  return {
    id: a.id,
    start: a.start,
    einde: a.einde,
    heleDag: a.heleDag,
    lesuur: null,
    omschrijving: a.titel,
    lokaal: a.locatie || null,
    labels: ['eigen'],
    vak: null,
    docenten: [],
    inhoudHtml: null,
    afgerond: false,
  };
}
