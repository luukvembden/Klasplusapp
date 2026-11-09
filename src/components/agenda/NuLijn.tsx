import { tijd } from '../../lib/datum';
import './agenda.css';

/**
 * Lijntje van de huidige tijd in de accentkleur: links de tijd, dan een bolletje op het midden van
 * de uurvakjes, en de lijn naar rechts. `top` is de hoogte binnen het element eromheen.
 */
export function NuLijn({ nu, top }: { nu: number; top: string }) {
  return (
    <span className="nulijn" style={{ top }} aria-label={`Nu ${tijd(new Date(nu))}`} role="img">
      <span className="nulijn__tijd">{tijd(new Date(nu))}</span>
    </span>
  );
}
