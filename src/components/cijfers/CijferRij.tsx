import type { Cijfer } from '../../api';
import { isOnvoldoende, toonCijfer } from '../../lib/cijfers';
import { korteDatum } from '../../lib/datum';
import './cijfers.css';

/** `nieuw`: vandaag binnengekomen; dan staat er "Nieuw" in plaats van de datum. */
export function CijferRij({ cijfer, nieuw = false }: { cijfer: Cijfer; nieuw?: boolean }) {
  return (
    <div className="cijferrij">
      <div className="cijferrij__tekst">
        <span className="cijferrij__vak">{cijfer.vak.naam}</span>
        <span className="cijferrij__toets">
          {cijfer.omschrijving} ·{' '}
          {nieuw ? <span className="cijferrij__nieuw">Nieuw</span> : korteDatum(cijfer.datum)}
        </span>
      </div>
      <div className="cijferrij__rechts">
        <span className={`cijferrij__cijfer${isOnvoldoende(cijfer.waarde) ? ' onvoldoende' : ''}`}>
          {toonCijfer(cijfer)}
        </span>
        <span className="cijfer__klein">weging {cijfer.weging}</span>
      </div>
    </div>
  );
}
