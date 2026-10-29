import { api, type AfspraakDetail, type Label } from '../api';
import { htmlNaarTekst } from '../lib/tekst';
import { useLaden } from './useLaden';

/** Labels die bij tekst van de docent horen, met de titel boven die tekst. */
const soorten: Partial<Record<Label, string>> = {
  proefwerk: 'Proefwerk',
  tentamen: 'Tentamen',
  so: 'SO',
  mondeling: 'Mondeling',
  huiswerk: 'Huiswerk',
  informatie: 'Informatie',
};

/** Wat voor tekst de docent schreef: een toets gaat voor huiswerk. */
export function soortVan(afspraak: AfspraakDetail): string {
  const label = (Object.keys(soorten) as Label[]).find((l) => afspraak.labels.includes(l));
  return label ? soorten[label]! : 'Notitie van de docent';
}

export function useAfspraak(id: string) {
  const toestand = useLaden(() => api.afspraak(id), [id]);
  const afspraak = toestand.data?.data;
  return {
    ...toestand,
    afspraak,
    tekst: afspraak?.inhoudHtml ? htmlNaarTekst(afspraak.inhoudHtml) : null,
  };
}
