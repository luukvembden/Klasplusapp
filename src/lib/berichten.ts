import type { Bericht, Contact } from '../api';
import { datumEnTijd } from './datum';
import { htmlNaarTekst } from './tekst';

/** Wat Nieuw bericht alvast invult bij beantwoorden of doorsturen. */
export interface Concept {
  soort: 'antwoord' | 'doorsturen';
  aan: Contact[];
  /** Staat de afzender niet als contact in het bericht, dan zoeken we alvast op zijn naam. */
  zoek: string;
  onderwerp: string;
  tekst: string;
  /** Het oorspronkelijke bericht had bijlagen; die gaan niet mee. */
  hadBijlagen: boolean;
}

/** "RE: Ouderavond", zonder "RE: RE: …" als je op een antwoord antwoordt. */
function metVoorvoegsel(voorvoegsel: 'RE' | 'FW', onderwerp: string): string {
  const kaal = onderwerp.replace(/^\s*((re|fw|fwd|antw|doorst)\s*:\s*)+/i, '').trim();
  return `${voorvoegsel}: ${kaal}`;
}

const tekstVan = (b: Bericht) => (b.inhoudHtml ? htmlNaarTekst(b.inhoudHtml).trim() : '');

/** Antwoord aan de afzender, met het oorspronkelijke bericht eronder. */
export function antwoordConcept(b: Bericht): Concept {
  return {
    soort: 'antwoord',
    aan: b.afzenderContact ? [b.afzenderContact] : [],
    zoek: b.afzenderContact ? '' : b.afzender,
    onderwerp: metVoorvoegsel('RE', b.onderwerp),
    tekst: `\n\n\nOp ${datumEnTijd(b.verzondenOp)} schreef ${b.afzender}:\n\n${tekstVan(b)}`,
    hadBijlagen: false,
  };
}

/** Doorsturen: zelf ontvangers kiezen, het hele bericht staat eronder. */
export function doorstuurConcept(b: Bericht): Concept {
  const kop = [
    '--- Doorgestuurd bericht ---',
    `Van: ${b.afzender}`,
    `Datum: ${datumEnTijd(b.verzondenOp)}`,
    b.ontvangers.length ? `Aan: ${b.ontvangers.join(', ')}` : '',
    `Onderwerp: ${b.onderwerp}`,
  ]
    .filter(Boolean)
    .join('\n');
  return {
    soort: 'doorsturen',
    aan: [],
    zoek: '',
    onderwerp: metVoorvoegsel('FW', b.onderwerp),
    tekst: `\n\n\n${kop}\n\n${tekstVan(b)}`,
    hadBijlagen: b.bijlagen.length > 0,
  };
}
