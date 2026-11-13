import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { negeerUpdate, zoekUpdate, type Update } from '../lib/update';
import { openExtern } from '../lib/tekst';
import './UpdateBalk.css';

/**
 * Smalle balk boven de tabbalk als er een nieuwe versie van Klas+ is (alleen op Android, zolang de app
 * niet in de Play Store staat). "Downloaden" opent de nieuwe APK; het kruisje verbergt hem tot de volgende.
 */
export function UpdateBalk() {
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    let weg = false;
    const kijk = () =>
      zoekUpdate()
        .then((u) => !weg && setUpdate(u))
        .catch(() => undefined);
    void kijk();
    // Ook als je de app later weer opent.
    const zichtbaar = () => document.visibilityState === 'visible' && void kijk();
    document.addEventListener('visibilitychange', zichtbaar);
    return () => {
      weg = true;
      document.removeEventListener('visibilitychange', zichtbaar);
    };
  }, []);

  if (!update) return null;

  return (
    <div className="updatebalk" role="status">
      <span className="updatebalk__tekst">Klas+ {update.versie} is uit</span>
      <button type="button" className="updatebalk__knop" onClick={() => openExtern(update.url)}>
        <Download size={16} strokeWidth={2.4} aria-hidden="true" />
        Downloaden
      </button>
      <button
        type="button"
        className="updatebalk__weg"
        aria-label="Later"
        onClick={() => {
          negeerUpdate(update.versie);
          setUpdate(null);
        }}
      >
        <X size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
