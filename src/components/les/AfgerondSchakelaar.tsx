import { useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../api';
import '../instellingen/instellingen.css';
import './les.css';

interface Props {
  id: string;
  afgerond: boolean;
  /** Na een geslaagde wijziging, zodat het scherm de labels direct kan bijwerken. */
  onWijzig: (afgerond: boolean) => void;
}

/** Schakelaar "Afgerond". Gaat naar de school, dus ook in de officiële app is het afgevinkt. */
export function AfgerondSchakelaar({ id, afgerond, onWijzig }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const wissel = async () => {
    const nieuw = !afgerond;
    // Meteen tonen; bij een fout zetten we hem terug.
    onWijzig(nieuw);
    setBezig(true);
    setFout(null);
    try {
      await api.zetAfgerond(id, nieuw);
    } catch (e) {
      onWijzig(!nieuw);
      setFout(
        navigator.onLine
          ? `Opslaan is niet gelukt. (${e instanceof Error ? e.message : String(e)})`
          : 'Je bent offline. Afvinken kan alleen met internet.',
      );
    } finally {
      setBezig(false);
    }
  };

  // Een ouder kan alleen zien of het kind het huiswerk heeft afgevinkt.
  if (api.isOuder()) {
    return (
      <section className="kaart">
        <div className="instelrij instelrij--vast">
          <span>Afgerond</span>
          <span className={afgerond ? 'afgerond-waarde afgerond-waarde--ja' : 'instelrij__waarde'}>
            {afgerond && <Check size={18} strokeWidth={2.6} aria-hidden="true" />}
            {afgerond ? 'Ja' : 'Nog niet'}
          </span>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="kaart">
        <label className="instelrij">
          <span>Afgerond</span>
          <input type="checkbox" role="switch" checked={afgerond} disabled={bezig} onChange={wissel} />
        </label>
      </section>
      {fout && (
        <p className="formulier-fout" role="alert">
          {fout}
        </p>
      )}
    </>
  );
}
