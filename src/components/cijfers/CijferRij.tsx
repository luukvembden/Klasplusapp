import type { Cijfer } from '../../api';
import { isOnvoldoende, toonCijfer } from '../../lib/cijfers';
import { korteDatum } from '../../lib/datum';
import './cijfers.css';

export function CijferRij({ cijfer }: { cijfer: Cijfer }) {
  return (
    <div className="cijferrij">
      <div className="cijferrij__tekst">
        <span className="cijferrij__vak">{cijfer.vak.naam}</span>
        <span className="cijferrij__toets">
          {cijfer.omschrijving} · {korteDatum(cijfer.datum)}
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
