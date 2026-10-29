import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Afspraak } from '../../api';
import { htmlNaarTekst, metHoofdletter } from '../../lib/tekst';
import { LesLabel } from '../agenda/LesLabel';
import './huiswerk.css';

/** Eén vak met huiswerk of een toets: vaknaam, begin van de tekst, labels. Tik voor alles. */
export function HuiswerkRij({ afspraak: a }: { afspraak: Afspraak }) {
  const tekst = a.inhoudHtml ? htmlNaarTekst(a.inhoudHtml).replace(/\s*\n+\s*/g, ' ') : '';

  return (
    <Link to={`/huiswerk/${encodeURIComponent(a.id)}`} className="huiswerkrij">
      <div className="huiswerkrij__tekst">
        <span className="huiswerkrij__vak">{metHoofdletter(a.vak ?? a.omschrijving)}</span>
        {tekst && <span className="huiswerkrij__inhoud">{tekst}</span>}
      </div>
      <div className="huiswerkrij__rechts">
        {a.labels.map((l) => (
          <LesLabel key={l} label={l} afgerond={a.afgerond} />
        ))}
      </div>
      <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
    </Link>
  );
}
