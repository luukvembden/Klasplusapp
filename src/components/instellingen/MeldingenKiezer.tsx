import { useState } from 'react';
import { useInstellingen, wijzigInstellingen, type Notificaties } from '../../lib/instellingen';
import { controleerNu, kanNotificaties, vraagToestemming } from '../../lib/notificaties';
import { Invoerrij } from '../les/Invoerrij';
import '../les/les.css';
import './instellingen.css';

const keuzes: { sleutel: 'cijfers' | 'rooster' | 'huiswerk'; naam: string; uitleg: string }[] = [
  { sleutel: 'cijfers', naam: 'Nieuw cijfer', uitleg: 'Zodra er een cijfer binnenkomt' },
  { sleutel: 'rooster', naam: 'Uur vervallen of gewijzigd', uitleg: 'Ander lokaal, andere docent of verplaatst' },
  { sleutel: 'huiswerk', naam: 'Huiswerkherinnering', uitleg: 'De avond ervoor, als het nog niet is afgevinkt' },
];

/** Welke meldingen je wilt. Bij de eerste keer aanzetten vraagt de telefoon om toestemming. */
export function MeldingenKiezer() {
  const { notificaties: n } = useInstellingen();
  const [fout, setFout] = useState<string | null>(null);

  const zet = async (wijziging: Partial<Notificaties>) => {
    setFout(null);
    const aanzetten = Object.values(wijziging).includes(true);
    if (aanzetten && kanNotificaties && !(await vraagToestemming())) {
      setFout('Klas+ mag nog geen meldingen sturen. Zet dit aan bij Instellingen → Meldingen op je telefoon.');
      return;
    }
    wijzigInstellingen({ notificaties: { ...n, ...wijziging } });
    // Meteen de huidige stand vastleggen (zodat oude cijfers geen melding geven) en herinneringen inplannen.
    void controleerNu(true);
  };

  return (
    <>
      <section className="kaart">
        {keuzes.map((k) => (
          <label key={k.sleutel} className="instelrij meldingrij" htmlFor={`melding-${k.sleutel}`}>
            <span className="meldingrij__tekst">
              <span>{k.naam}</span>
              <span className="meldingrij__uitleg">{k.uitleg}</span>
            </span>
            <input
              id={`melding-${k.sleutel}`}
              type="checkbox"
              checked={n[k.sleutel]}
              onChange={(e) => void zet({ [k.sleutel]: e.target.checked })}
            />
          </label>
        ))}
        {n.huiswerk && (
          <Invoerrij label="Herinnering om" voor="melding-tijd">
            <input
              id="melding-tijd"
              type="time"
              className="invoerrij__veld"
              value={n.huiswerkTijd}
              onChange={(e) => e.target.value && void zet({ huiswerkTijd: e.target.value })}
            />
          </Invoerrij>
        )}
      </section>
      {fout && <p className="melding">{fout}</p>}
    </>
  );
}
