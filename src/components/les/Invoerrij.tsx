import type { ReactNode } from 'react';
import { nlMoment } from '../../lib/datum';
import './les.css';

/** Een rij "label — invoerveld", in dezelfde stijl als de rijen op Lesinformatie. */
export function Invoerrij({ label, voor, children }: { label: string; voor: string; children: ReactNode }) {
  return (
    <label className="gegevenrij invoerrij" htmlFor={voor}>
      <span className="gegevenrij__label">{label}</span>
      {children}
    </label>
  );
}

/** "2026-10-29" en "09:30" uit de invoervelden → één moment. */
export const opMoment = (datum: string, tijd: string) => {
  const [j, mnd, dag] = datum.split('-').map(Number);
  const [u, m] = tijd.split(':').map(Number);
  // In Nederlandse tijd, wat de tijdzone van het toestel ook is.
  return nlMoment(j, mnd - 1, dag, u, m);
};
