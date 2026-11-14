import { useEffect, useState } from 'react';
import { useInstellingen, wijzigInstellingen, type Notificaties } from '../../lib/instellingen';
import {
  controleerNu,
  kanNotificaties,
  meldingStatus,
  stuurTestmelding,
  vraagBatterij,
  vraagPreciezeTijd,
  vraagToestemming,
  type MeldingStatus,
} from '../../lib/notificaties';
import { datumEnTijd } from '../../lib/datum';
import { Invoerrij } from '../les/Invoerrij';
import '../les/les.css';
import './instellingen.css';

const keuzes: { sleutel: 'cijfers' | 'rooster' | 'huiswerk' | 'ochtend'; naam: string; uitleg: string }[] = [
  { sleutel: 'cijfers', naam: 'Nieuw cijfer', uitleg: 'Zodra er een cijfer binnenkomt' },
  { sleutel: 'rooster', naam: 'Uur vervallen of gewijzigd', uitleg: 'Ander lokaal, andere docent of verplaatst' },
  { sleutel: 'huiswerk', naam: 'Huiswerkherinnering', uitleg: 'De avond ervoor, als het nog niet is afgevinkt' },
  { sleutel: 'ochtend', naam: 'Ochtendmelding', uitleg: 'Je eerste les, en wat er die dag vervalt of gewijzigd is' },
];

/** Bij welke melding hoort een tijdstip, en onder welk label. */
const tijden = {
  huiswerk: { veld: 'huiswerkTijd', label: 'Herinnering om' },
  ochtend: { veld: 'ochtendTijd', label: 'Melding om' },
} as const;

/** Welke meldingen je wilt. Bij de eerste keer aanzetten vraagt de telefoon om toestemming. */
export function MeldingenKiezer() {
  const { notificaties: n } = useInstellingen();
  const [fout, setFout] = useState<string | null>(null);
  const [status, setStatus] = useState<MeldingStatus | null>(null);
  const [test, setTest] = useState<string | null>(null);
  const ververs = () => void meldingStatus().then(setStatus);

  // Status bij openen, en opnieuw als je terugkomt uit de instellingen van de telefoon.
  useEffect(() => {
    ververs();
    const opZicht = () => document.visibilityState === 'visible' && ververs();
    document.addEventListener('visibilitychange', opZicht);
    return () => document.removeEventListener('visibilitychange', opZicht);
  }, []);
  const iets = n.cijfers || n.rooster || n.huiswerk || n.ochtend;

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
        {keuzes.map((k) => {
          const t = k.sleutel === 'huiswerk' || k.sleutel === 'ochtend' ? tijden[k.sleutel] : null;
          return (
            <div key={k.sleutel} className="meldinggroep">
              <label className="instelrij meldingrij" htmlFor={`melding-${k.sleutel}`}>
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
              {t && n[k.sleutel] && (
                <Invoerrij label={t.label} voor={`melding-${t.veld}`}>
                  <input
                    id={`melding-${t.veld}`}
                    type="time"
                    className="invoerrij__veld"
                    value={n[t.veld]}
                    onChange={(e) => e.target.value && void zet({ [t.veld]: e.target.value })}
                  />
                </Invoerrij>
              )}
            </div>
          );
        })}
      </section>
      {fout && <p className="melding">{fout}</p>}

      {/* Hoe staat het ervoor: toestemming, precieze tijd (Android), laatste keer gekeken, en een test. */}
      {kanNotificaties && status && (
        <section className="kaart">
          <div className="instelrij instelrij--vast">
            <span>Toestemming van je telefoon</span>
            <span className="instelrij__waarde">{status.toestemming ? 'Aan' : 'Uit'}</span>
          </div>
          {status.preciezeTijd !== null && (
            <button
              type="button"
              className="instelrij"
              onClick={() => void vraagPreciezeTijd().then(ververs)}
              disabled={status.preciezeTijd}
            >
              <span className="meldingrij__tekst">
                <span>Op de precieze tijd</span>
                <span className="meldingrij__uitleg">
                  {status.preciezeTijd
                    ? 'Ochtend- en huiswerkmeldingen komen op tijd'
                    : 'Staat uit: je telefoon kan ze uitstellen. Tik om aan te zetten.'}
                </span>
              </span>
              <span className="instelrij__waarde">{status.preciezeTijd ? 'Aan' : 'Zet aan'}</span>
            </button>
          )}
          {status.batterijOnbeperkt !== null && n.ochtend && (
            <button
              type="button"
              className="instelrij"
              onClick={() => void vraagBatterij().then(ververs)}
              disabled={status.batterijOnbeperkt}
            >
              <span className="meldingrij__tekst">
                <span>Batterij onbeperkt</span>
                <span className="meldingrij__uitleg">
                  {status.batterijOnbeperkt
                    ? 'De ochtendmelding haalt eerst je rooster van dat moment op'
                    : 'Dan kan de ochtendmelding ’s ochtends eerst je rooster ophalen. Tik om toe te staan.'}
                </span>
              </span>
              <span className="instelrij__waarde">{status.batterijOnbeperkt ? 'Aan' : 'Zet aan'}</span>
            </button>
          )}
          {iets && (
            <div className="instelrij instelrij--vast">
              <span>Laatst gekeken</span>
              <span className="instelrij__waarde">
                {status.laatste
                  ? `${datumEnTijd(status.laatste.op)}${status.laatste.achtergrond ? ' (achtergrond)' : ''}`
                  : 'Nog niet'}
              </span>
            </div>
          )}
          <button
            type="button"
            className="instelrij"
            onClick={() => {
              setTest(null);
              stuurTestmelding()
                .then(() => setTest('Over 5 seconden komt er een testmelding. Zet de app gerust weg.'))
                .catch((e: unknown) => setTest(e instanceof Error ? e.message : 'De testmelding is niet gelukt.'))
                .finally(ververs);
            }}
          >
            <span>Stuur testmelding</span>
          </button>
        </section>
      )}
      {test && <p className="instellingen__let-op">{test}</p>}
    </>
  );
}
