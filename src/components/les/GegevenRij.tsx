import type { ReactNode } from 'react';
import './les.css';

/** Eén regel "label — waarde" in een kaart. Zonder waarde wordt niets getoond. */
export function GegevenRij({ label, waarde }: { label: string; waarde?: ReactNode }) {
  if (waarde === undefined || waarde === null || waarde === '') return null;
  return (
    <div className="gegevenrij">
      <span className="gegevenrij__label">{label}</span>
      <span className="gegevenrij__waarde">{waarde}</span>
    </div>
  );
}
