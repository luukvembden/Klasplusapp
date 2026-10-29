import type { Resultaat } from '../../api';
import { bijgewerkt } from '../../lib/datum';
import './ui.css';

/** Smalle balk onderaan een scherm: "Bijgewerkt op 28-10 om 15:22", of "Offline · bijgewerkt op …". */
export function BijgewerktBalk({ resultaat }: { resultaat?: Resultaat<unknown> }) {
  if (!resultaat) return null;
  return (
    <div className="bijgewerkt-balk" role="status">
      {resultaat.offline ? 'Offline · bijgewerkt' : 'Bijgewerkt'} op {bijgewerkt(resultaat.opgehaaldOp)}
    </div>
  );
}
