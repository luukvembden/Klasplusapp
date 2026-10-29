import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dagKort, dagTitel, maandagVan, naarInvoer, nlTijd, plusDagen, zelfdeDag } from '../../lib/datum';
import './agenda.css';

interface Props {
  dag: Date;
  onKies: (dag: Date) => void;
}

/** Strook met ma–zo van de gekozen week, en pijltjes naar de vorige/volgende week. */
export function DagStrook({ dag, onKies }: Props) {
  const maandag = maandagVan(dag);
  const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(maandag, i));

  return (
    <div className="dagstrook">
      <button type="button" className="dagstrook__pijl" aria-label="Vorige week" onClick={() => onKies(plusDagen(dag, -7))}>
        <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="dagstrook__dagen">
        {dagen.map((d) => {
          const actief = zelfdeDag(d, dag);
          return (
            <button
              key={naarInvoer(d)}
              type="button"
              className="dagstrook__dag"
              aria-pressed={actief}
              aria-label={dagTitel(d)}
              onClick={() => onKies(d)}
            >
              <span className="dagstrook__kort">{dagKort(d)}</span>
              <span className="dagstrook__nr">{nlTijd(d).dag}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="dagstrook__pijl" aria-label="Volgende week" onClick={() => onKies(plusDagen(dag, 7))}>
        <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
