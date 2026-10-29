import type { ReactNode } from 'react';
import './ui.css';

/** Kopje in hoofdletters met een witte kaart eronder. */
export function Sectie({ titel, children, nawoord }: { titel: string; children: ReactNode; nawoord?: ReactNode }) {
  return (
    <div className="sectie">
      <h2 className="sectie__titel">{titel}</h2>
      {children}
      {nawoord}
    </div>
  );
}
