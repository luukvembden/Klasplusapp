import { WifiOff } from 'lucide-react';
import type { Resultaat } from '../../api';
import { bijgewerkt } from '../../lib/datum';
import './ui.css';

/** Toont alleen iets als de gegevens uit de offline cache komen. */
export function OfflineRegel({ resultaat }: { resultaat?: Resultaat<unknown> }) {
  if (!resultaat?.offline) return null;
  return (
    <p className="offline-regel" role="status">
      <WifiOff size={15} strokeWidth={2} aria-hidden="true" />
      Offline · bijgewerkt op {bijgewerkt(resultaat.opgehaaldOp)}
    </p>
  );
}
